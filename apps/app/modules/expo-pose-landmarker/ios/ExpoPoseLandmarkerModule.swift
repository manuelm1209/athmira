import ExpoModulesCore
import MediaPipeTasksVision
import UIKit

// MediaPipe Pose Landmarker → COCO-17 landmark name mapping. Mirrors
// MEDIAPIPE_TO_COCO17 in landmarkMapping.ts. Indices unmapped here are dropped
// before being sent across the bridge (we only need the 17 keypoints the
// athmira overlay math expects).
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

public class ExpoPoseLandmarkerModule: Module {
  private var landmarker: PoseLandmarker?
  private var activeDelegate: Delegate = .GPU
  private let modelAssetName = "pose_landmarker_lite"

  public func definition() -> ModuleDefinition {
    Name("ExpoPoseLandmarkerModule")

    OnCreate {
      do {
        try self.initializeLandmarker()
      } catch {
        NSLog("[ExpoPoseLandmarker] init failed: \(error.localizedDescription)")
      }
    }

    AsyncFunction("detectPoseFromUri") { (uri: String, promise: Promise) in
      guard let landmarker = self.landmarker else {
        promise.reject("E_NOT_READY", "PoseLandmarker is not initialized")
        return
      }

      guard let image = self.loadImage(fromUri: uri) else {
        promise.reject("E_IMAGE_LOAD", "Could not load image at \(uri)")
        return
      }

      guard let mpImage = try? MPImage(uiImage: image) else {
        promise.reject("E_MP_IMAGE", "Could not create MPImage from UIImage")
        return
      }

      let startedAt = Date()

      do {
        let result = try landmarker.detect(image: mpImage)
        let inferenceMs = Date().timeIntervalSince(startedAt) * 1000.0

        guard let firstPose = result.landmarks.first else {
          promise.resolve(nil)
          return
        }

        var landmarks: [[String: Any]] = []
        for (index, landmark) in firstPose.enumerated() {
          guard let name = mediaPipeIndexToCoco17[index] else { continue }
          // MediaPipe presence/visibility are NSNumber? in the Swift bridge.
          // Prefer presence (model confidence the landmark exists);
          // fall back to visibility if presence is nil.
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

        promise.resolve([
          "landmarks": landmarks,
          "imageWidth": Double(image.size.width * image.scale),
          "imageHeight": Double(image.size.height * image.scale),
          "inferenceMs": inferenceMs,
          "delegate": self.activeDelegate == .GPU ? "gpu" : "cpu"
        ])
      } catch {
        promise.reject("E_DETECT", error.localizedDescription)
      }
    }
    .runOnQueue(.global(qos: .userInitiated))

    AsyncFunction("warmUp") { (promise: Promise) in
      guard let landmarker = self.landmarker else {
        promise.resolve(nil)
        return
      }
      // Build a 192x192 black UIImage and run one detection to prime the
      // Metal pipeline. First inference cost is ~200-400 ms; subsequent
      // calls are ~15-25 ms.
      let warmUpImage = self.makeBlackImage(side: 192)
      if let mpImage = try? MPImage(uiImage: warmUpImage) {
        _ = try? landmarker.detect(image: mpImage)
      }
      promise.resolve(nil)
    }
    .runOnQueue(.global(qos: .userInitiated))

    Function("getActiveDelegate") { () -> String in
      return self.activeDelegate == .GPU ? "gpu" : "cpu"
    }

    // M2: live-stream view. Owns the AVCaptureSession, runs MediaPipe in
    // `.liveStream` mode, emits poses directly via the `onPose` event.
    // See PoseLandmarkerView.swift for the implementation.
    View(PoseLandmarkerView.self) {
      Events("onPose", "onReady", "onMountError")

      Prop("facing") { (view: PoseLandmarkerView, value: String) in
        view.facing = value
      }
      Prop("mirror") { (view: PoseLandmarkerView, value: Bool) in
        view.mirror = value
      }
      Prop("enabled") { (view: PoseLandmarkerView, value: Bool) in
        view.enabled = value
      }

      AsyncFunction("takePicture") { (view: PoseLandmarkerView, promise: Promise) in
        view.takePicture(promise: promise)
      }
    }
  }

  // MARK: - Private helpers

  private func initializeLandmarker() throws {
    let options = PoseLandmarkerOptions()
    guard
      let modelPath = Bundle.main.path(forResource: modelAssetName, ofType: "task")
        ?? Bundle(for: type(of: self)).path(forResource: modelAssetName, ofType: "task")
    else {
      throw NSError(
        domain: "ExpoPoseLandmarker",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "Bundled \(modelAssetName).task not found"]
      )
    }
    options.baseOptions.modelAssetPath = modelPath
    options.baseOptions.delegate = .GPU
    options.runningMode = .image
    options.numPoses = 1
    options.minPoseDetectionConfidence = 0.5
    options.minPosePresenceConfidence = 0.5
    options.minTrackingConfidence = 0.5

    do {
      self.landmarker = try PoseLandmarker(options: options)
      self.activeDelegate = .GPU
    } catch {
      // Some older devices reject the GPU delegate. Fall back to CPU.
      NSLog("[ExpoPoseLandmarker] GPU delegate failed, falling back to CPU: \(error.localizedDescription)")
      options.baseOptions.delegate = .CPU
      self.landmarker = try PoseLandmarker(options: options)
      self.activeDelegate = .CPU
    }
    NSLog("[ExpoPoseLandmarker] initialized with delegate: \(self.activeDelegate == .GPU ? "GPU" : "CPU")")
  }

  private func loadImage(fromUri uri: String) -> UIImage? {
    let cleaned = uri.hasPrefix("file://") ? String(uri.dropFirst("file://".count)) : uri
    return UIImage(contentsOfFile: cleaned)
  }

  private func makeBlackImage(side: Int) -> UIImage {
    let size = CGSize(width: side, height: side)
    let renderer = UIGraphicsImageRenderer(size: size)
    return renderer.image { context in
      UIColor.black.setFill()
      context.fill(CGRect(origin: .zero, size: size))
    }
  }
}
