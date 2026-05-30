import AVFoundation
import ExpoModulesCore
import MediaPipeTasksVision
import UIKit

// Same mapping table as ExpoPoseLandmarkerModule.swift. Keep them in sync.
private let mediaPipeIndexToCoco17: [Int: String] = [
  0: "nose",
  2: "left_eye",
  5: "right_eye",
  7: "left_ear",
  8: "right_ear",
  11: "left_shoulder",
  12: "right_shoulder",
  13: "left_elbow",
  14: "right_elbow",
  15: "left_wrist",
  16: "right_wrist",
  23: "left_hip",
  24: "right_hip",
  25: "left_knee",
  26: "right_knee",
  27: "left_ankle",
  28: "right_ankle"
]

/// Live-stream pose detection view. Owns the AVCaptureSession, runs MediaPipe
/// in `.liveStream` mode against each video frame, and emits pose events to
/// JS at the camera's native frame rate (clamped by inference latency).
///
/// Frame coordinates emitted to JS are in normalized [0, 1] view-space — i.e.
/// they already reflect the `mirror` prop, so the JS SVG overlay can draw
/// without applying its own mirror transform.
public class PoseLandmarkerView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate, PoseLandmarkerLiveStreamDelegate {
  // Public events
  let onPose = EventDispatcher()
  let onReady = EventDispatcher()
  let onMountError = EventDispatcher()

  // Public props
  var facing: String = "front" {
    didSet {
      if oldValue != facing { reconfigureSession() }
    }
  }
  var mirror: Bool = true
  var enabled: Bool = true

  // AV plumbing
  private let session = AVCaptureSession()
  private let sessionQueue = DispatchQueue(label: "athmira.pose-landmarker.session")
  private let videoOutputQueue = DispatchQueue(label: "athmira.pose-landmarker.video", qos: .userInitiated)
  private var previewLayer: AVCaptureVideoPreviewLayer?
  private var videoOutput: AVCaptureVideoDataOutput?

  // MediaPipe
  private var landmarker: PoseLandmarker?
  private var landmarkerInputSize: CGSize = .zero
  private var activeDelegate: Delegate = .GPU
  private var lastFrameTimestampMs: Int = 0

  // Latest frame, retained so `takePicture` can save it as a JPEG. Keeps
  // memory pressure low (one CMSampleBuffer; old ones get released).
  private var latestSampleBuffer: CMSampleBuffer?
  private let latestBufferLock = NSLock()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    backgroundColor = .black

    let preview = AVCaptureVideoPreviewLayer(session: session)
    preview.videoGravity = .resizeAspectFill
    layer.addSublayer(preview)
    previewLayer = preview

    sessionQueue.async { [weak self] in
      self?.configureSession()
      self?.initializeLandmarker()
      self?.session.startRunning()
      DispatchQueue.main.async {
        self?.applyCurrentDeviceOrientation()
        self?.onReady([:])
      }
    }

    // Track device rotation so the camera follows the UI when the user
    // flips between portrait and landscape.
    UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleOrientationChange),
      name: UIDevice.orientationDidChangeNotification,
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    previewLayer?.frame = bounds
    applyMirroringIfNeeded()
  }

  public override func removeFromSuperview() {
    sessionQueue.async { [weak self] in
      self?.session.stopRunning()
    }
    super.removeFromSuperview()
  }

  // MARK: - Session configuration

  private func configureSession() {
    session.beginConfiguration()
    session.sessionPreset = .hd1280x720

    // Remove anything previously attached
    for input in session.inputs { session.removeInput(input) }
    for output in session.outputs { session.removeOutput(output) }

    // Camera input
    let position: AVCaptureDevice.Position = (facing == "back") ? .back : .front
    guard
      let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position),
      let input = try? AVCaptureDeviceInput(device: device)
    else {
      session.commitConfiguration()
      DispatchQueue.main.async {
        self.onMountError(["message": "Could not open \(position == .front ? "front" : "back") camera"])
      }
      return
    }
    if session.canAddInput(input) { session.addInput(input) }

    // Video output (for MediaPipe ingestion)
    let output = AVCaptureVideoDataOutput()
    output.alwaysDiscardsLateVideoFrames = true
    output.videoSettings = [
      kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA)
    ]
    output.setSampleBufferDelegate(self, queue: videoOutputQueue)
    if session.canAddOutput(output) { session.addOutput(output) }
    videoOutput = output

    session.commitConfiguration()

    DispatchQueue.main.async {
      self.applyMirroringIfNeeded()
      self.applyCurrentDeviceOrientation()
    }
  }

  private func reconfigureSession() {
    sessionQueue.async { [weak self] in
      guard let self else { return }
      let wasRunning = self.session.isRunning
      if wasRunning { self.session.stopRunning() }
      self.configureSession()
      if wasRunning { self.session.startRunning() }
    }
  }

  private func applyMirroringIfNeeded() {
    guard let connection = previewLayer?.connection else { return }
    if connection.isVideoMirroringSupported {
      connection.automaticallyAdjustsVideoMirroring = false
      // Mirror only the front camera when requested by the JS side
      connection.isVideoMirrored = (facing == "front") && mirror
    }
  }

  @objc private func handleOrientationChange() {
    DispatchQueue.main.async {
      self.applyCurrentDeviceOrientation()
    }
  }

  /// Map the physical device orientation to the right
  /// `AVCaptureVideoOrientation` and propagate to both the preview layer
  /// and the data output. Called once on mount and on every device rotation.
  private func applyCurrentDeviceOrientation() {
    let videoOrientation: AVCaptureVideoOrientation = {
      switch UIDevice.current.orientation {
      case .portrait: return .portrait
      case .portraitUpsideDown: return .portraitUpsideDown
      // Note: device "landscape left" (home button on the left) corresponds
      // to the camera's "landscape right" and vice versa — this is the
      // standard iOS convention.
      case .landscapeLeft: return .landscapeRight
      case .landscapeRight: return .landscapeLeft
      default: return .portrait
      }
    }()

    if let connection = previewLayer?.connection, connection.isVideoOrientationSupported {
      connection.videoOrientation = videoOrientation
    }
    if let connection = videoOutput?.connection(with: .video), connection.isVideoOrientationSupported {
      connection.videoOrientation = videoOrientation
    }
  }

  // MARK: - MediaPipe

  private func initializeLandmarker() {
    let options = PoseLandmarkerOptions()
    guard
      let modelPath = Bundle.main.path(forResource: "pose_landmarker_lite", ofType: "task")
        ?? Bundle(for: type(of: self)).path(forResource: "pose_landmarker_lite", ofType: "task")
    else {
      DispatchQueue.main.async {
        self.onMountError(["message": "Bundled pose_landmarker_lite.task not found"])
      }
      return
    }
    options.baseOptions.modelAssetPath = modelPath
    options.baseOptions.delegate = .GPU
    options.runningMode = .liveStream
    options.numPoses = 1
    options.minPoseDetectionConfidence = 0.5
    options.minPosePresenceConfidence = 0.5
    options.minTrackingConfidence = 0.5
    options.poseLandmarkerLiveStreamDelegate = self

    do {
      self.landmarker = try PoseLandmarker(options: options)
      self.activeDelegate = .GPU
    } catch {
      NSLog("[PoseLandmarkerView] GPU delegate failed, falling back to CPU: \(error.localizedDescription)")
      options.baseOptions.delegate = .CPU
      do {
        self.landmarker = try PoseLandmarker(options: options)
        self.activeDelegate = .CPU
      } catch {
        DispatchQueue.main.async {
          self.onMountError(["message": "Could not initialize PoseLandmarker: \(error.localizedDescription)"])
        }
      }
    }
    NSLog("[PoseLandmarkerView] initialized with delegate: \(self.activeDelegate == .GPU ? "GPU" : "CPU")")
  }

  // MARK: - AVCaptureVideoDataOutputSampleBufferDelegate

  public func captureOutput(
    _ output: AVCaptureOutput,
    didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    guard enabled, let landmarker = landmarker else { return }

    // MediaPipe live-stream mode requires strictly increasing timestamps in ms.
    let timestampMs = Int(Date().timeIntervalSince1970 * 1000)
    if timestampMs <= lastFrameTimestampMs { return }
    lastFrameTimestampMs = timestampMs

    // Pick the right orientation for MediaPipe based on camera + UI.
    // Since we lock the connection to portrait above, .up is generally
    // correct, but front camera also needs mirroring applied to the
    // image itself so landmark coords match the (mirrored) preview.
    let orientation: UIImage.Orientation = {
      if facing == "front" && mirror {
        return .upMirrored
      }
      return .up
    }()

    // Stash the latest frame so takePicture() can save it.
    latestBufferLock.lock()
    latestSampleBuffer = sampleBuffer
    latestBufferLock.unlock()

    guard let mpImage = try? MPImage(sampleBuffer: sampleBuffer, orientation: orientation) else {
      return
    }

    do {
      try landmarker.detectAsync(image: mpImage, timestampInMilliseconds: timestampMs)
    } catch {
      NSLog("[PoseLandmarkerView] detectAsync failed: \(error.localizedDescription)")
    }
  }

  // MARK: - Still-frame capture

  /// Save the most recent camera frame as a JPEG and return its file URI.
  /// Used by the analysis flow to grab a thumbnail without stopping the
  /// live stream. Returns nil if no frame has been received yet.
  public func takePicture(promise: Promise) {
    latestBufferLock.lock()
    let buffer = latestSampleBuffer
    latestBufferLock.unlock()

    guard
      let sampleBuffer = buffer,
      let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer)
    else {
      promise.resolve(nil)
      return
    }

    DispatchQueue.global(qos: .userInitiated).async {
      let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
      let context = CIContext()
      guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else {
        DispatchQueue.main.async { promise.resolve(nil) }
        return
      }
      // Match the visible preview's mirroring so the saved still looks
      // like what the user just saw.
      let orientation: UIImage.Orientation = {
        if self.facing == "front" && self.mirror {
          return .upMirrored
        }
        return .up
      }()
      let uiImage = UIImage(cgImage: cgImage, scale: 1.0, orientation: orientation)
      guard let jpegData = uiImage.jpegData(compressionQuality: 0.7) else {
        DispatchQueue.main.async { promise.resolve(nil) }
        return
      }
      let fileURL = FileManager.default.temporaryDirectory
        .appendingPathComponent("\(UUID().uuidString).jpg")
      do {
        try jpegData.write(to: fileURL)
        DispatchQueue.main.async { promise.resolve(fileURL.absoluteString) }
      } catch {
        DispatchQueue.main.async {
          promise.reject("E_WRITE", error.localizedDescription)
        }
      }
    }
  }

  // MARK: - PoseLandmarkerLiveStreamDelegate

  public func poseLandmarker(
    _ poseLandmarker: PoseLandmarker,
    didFinishDetection result: PoseLandmarkerResult?,
    timestampInMilliseconds: Int,
    error: Error?
  ) {
    if let error = error {
      NSLog("[PoseLandmarkerView] live-stream error: \(error.localizedDescription)")
      return
    }
    guard let firstPose = result?.landmarks.first else {
      DispatchQueue.main.async { self.onPose(["landmarks": [] as [Any], "timestampMs": timestampInMilliseconds]) }
      return
    }

    var landmarks: [[String: Any]] = []
    for (index, landmark) in firstPose.enumerated() {
      guard let name = mediaPipeIndexToCoco17[index] else { continue }
      let confidence = landmark.presence?.doubleValue
        ?? landmark.visibility?.doubleValue
        ?? 0.0
      landmarks.append([
        "name": name,
        "x": Double(landmark.x),
        "y": Double(landmark.y),
        "confidence": confidence
      ])
    }

    DispatchQueue.main.async {
      self.onPose([
        "landmarks": landmarks,
        "timestampMs": timestampInMilliseconds,
        "delegate": self.activeDelegate == .GPU ? "gpu" : "cpu"
      ])
    }
  }
}
