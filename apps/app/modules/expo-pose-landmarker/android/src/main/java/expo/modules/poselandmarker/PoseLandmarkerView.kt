package expo.modules.poselandmarker

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.LifecycleOwner
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.Executors

private const val TAG = "PoseLandmarkerView"
private const val MODEL_ASSET_NAME = "pose_landmarker_lite.task"

// Mirror of MEDIAPIPE_TO_COCO17 in ExpoPoseLandmarkerModule.kt — keep in sync.
private val MEDIAPIPE_TO_COCO17 = mapOf(
  0 to "nose",
  2 to "left_eye",
  5 to "right_eye",
  7 to "left_ear",
  8 to "right_ear",
  11 to "left_shoulder",
  12 to "right_shoulder",
  13 to "left_elbow",
  14 to "right_elbow",
  15 to "left_wrist",
  16 to "right_wrist",
  23 to "left_hip",
  24 to "right_hip",
  25 to "left_knee",
  26 to "right_knee",
  27 to "left_ankle",
  28 to "right_ankle"
)

class PoseLandmarkerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val onPose by EventDispatcher()
  val onReady by EventDispatcher()
  val onMountError by EventDispatcher()

  var facing: String = "front"
    set(value) {
      val changed = field != value
      field = value
      if (changed) restartCamera()
    }
  var mirror: Boolean = true
  var analysisEnabled: Boolean = true

  private val previewView = PreviewView(context).apply {
    layoutParams = android.view.ViewGroup.LayoutParams(
      android.view.ViewGroup.LayoutParams.MATCH_PARENT,
      android.view.ViewGroup.LayoutParams.MATCH_PARENT
    )
    scaleType = PreviewView.ScaleType.FILL_CENTER
  }
  private val analyzerExecutor = Executors.newSingleThreadExecutor()
  private var cameraProvider: ProcessCameraProvider? = null
  private var landmarker: PoseLandmarker? = null
  private var activeDelegate: Delegate = Delegate.GPU
  private var lastFrameTimestampMs: Long = 0L

  // Latest rotated/mirrored bitmap, kept around so takePicture() can save
  // it as a JPEG without stopping the live stream.
  @Volatile private var latestBitmap: Bitmap? = null

  init {
    addView(previewView)
    initializeLandmarker()
    startCamera()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    cameraProvider?.unbindAll()
    landmarker?.close()
    landmarker = null
    analyzerExecutor.shutdownNow()
  }

  // MARK: - MediaPipe

  private fun initializeLandmarker() {
    val ctx = appContext.reactContext ?: return

    fun build(delegate: Delegate): PoseLandmarker {
      val baseOptions = BaseOptions.builder()
        .setModelAssetPath(MODEL_ASSET_NAME)
        .setDelegate(delegate)
        .build()
      val options = PoseLandmarker.PoseLandmarkerOptions.builder()
        .setBaseOptions(baseOptions)
        .setRunningMode(RunningMode.LIVE_STREAM)
        .setNumPoses(1)
        .setMinPoseDetectionConfidence(0.5f)
        .setMinPosePresenceConfidence(0.5f)
        .setMinTrackingConfidence(0.5f)
        .setResultListener { result, _ -> onPoseResult(result) }
        .setErrorListener { e -> Log.e(TAG, "MediaPipe live-stream error", e) }
        .build()
      return PoseLandmarker.createFromOptions(ctx, options)
    }

    landmarker = try {
      activeDelegate = Delegate.GPU
      build(Delegate.GPU)
    } catch (error: Throwable) {
      Log.w(TAG, "GPU delegate failed, falling back to CPU", error)
      activeDelegate = Delegate.CPU
      try {
        build(Delegate.CPU)
      } catch (cpuError: Throwable) {
        onMountError(mapOf("message" to "Could not initialize PoseLandmarker: ${cpuError.message}"))
        null
      }
    }
    Log.i(TAG, "initialized with delegate: $activeDelegate")
  }

  private fun onPoseResult(result: PoseLandmarkerResult) {
    val firstPose = result.landmarks().firstOrNull()
    if (firstPose == null) {
      onPose(mapOf("landmarks" to emptyList<Any>(), "timestampMs" to result.timestampMs()))
      return
    }
    val landmarks = mutableListOf<Map<String, Any>>()
    firstPose.forEachIndexed { index, landmark ->
      val name = MEDIAPIPE_TO_COCO17[index] ?: return@forEachIndexed
      val confidence = landmark.presence().orElse(landmark.visibility().orElse(0f))
      landmarks.add(
        mapOf(
          "name" to name,
          "x" to landmark.x().toDouble(),
          "y" to landmark.y().toDouble(),
          "confidence" to confidence.toDouble()
        )
      )
    }
    onPose(
      mapOf(
        "landmarks" to landmarks,
        "timestampMs" to result.timestampMs(),
        "delegate" to if (activeDelegate == Delegate.GPU) "gpu" else "cpu"
      )
    )
  }

  // MARK: - CameraX

  private fun lifecycleOwner(): LifecycleOwner? {
    // Expo's currentActivity is typically a FragmentActivity, which is a
    // LifecycleOwner. Fall back to checking the React context for older
    // RN versions where the activity may not have shipped that interface yet.
    val activity = appContext.currentActivity
    if (activity is LifecycleOwner) return activity
    val ctx = appContext.reactContext
    if (ctx is LifecycleOwner) return ctx
    return null
  }

  private fun startCamera() {
    val ctx = appContext.reactContext ?: return
    val owner = lifecycleOwner() ?: run {
      onMountError(mapOf("message" to "Could not resolve a LifecycleOwner for CameraX"))
      return
    }
    val providerFuture = ProcessCameraProvider.getInstance(ctx)
    providerFuture.addListener({
      try {
        val provider = providerFuture.get()
        cameraProvider = provider
        bindUseCases(provider, owner)
        onReady(emptyMap<String, Any>())
      } catch (error: Throwable) {
        Log.e(TAG, "Failed to start camera", error)
        onMountError(mapOf("message" to (error.message ?: "Camera bind failed")))
      }
    }, androidx.core.content.ContextCompat.getMainExecutor(ctx))
  }

  private fun restartCamera() {
    cameraProvider?.unbindAll()
    val provider = cameraProvider ?: return
    val owner = lifecycleOwner() ?: return
    bindUseCases(provider, owner)
  }

  private fun bindUseCases(provider: ProcessCameraProvider, lifecycleOwner: LifecycleOwner) {
    val selector = if (facing == "back") {
      CameraSelector.DEFAULT_BACK_CAMERA
    } else {
      CameraSelector.DEFAULT_FRONT_CAMERA
    }

    val preview = Preview.Builder().build().also {
      it.setSurfaceProvider(previewView.surfaceProvider)
    }

    val analyzer = ImageAnalysis.Builder()
      .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
      .build()
      .also {
        it.setAnalyzer(analyzerExecutor, ::analyze)
      }

    provider.unbindAll()
    provider.bindToLifecycle(lifecycleOwner, selector, preview, analyzer)
  }

  // MARK: - Frame ingestion

  private fun analyze(imageProxy: ImageProxy) {
    val landmarker = this.landmarker
    if (!analysisEnabled || landmarker == null) {
      imageProxy.close()
      return
    }

    val now = System.currentTimeMillis()
    if (now <= lastFrameTimestampMs) {
      imageProxy.close()
      return
    }
    lastFrameTimestampMs = now

    val mpImage: MPImage? = try {
      buildMpImage(imageProxy)
    } catch (error: Throwable) {
      Log.w(TAG, "buildMpImage failed", error)
      null
    }
    if (mpImage == null) {
      imageProxy.close()
      return
    }

    try {
      landmarker.detectAsync(mpImage, now)
    } catch (error: Throwable) {
      Log.w(TAG, "detectAsync failed", error)
    } finally {
      imageProxy.close()
    }
  }

  private fun buildMpImage(imageProxy: ImageProxy): MPImage? {
    val bitmap = imageProxy.toBitmap()
    val rotationDegrees = imageProxy.imageInfo.rotationDegrees
    val matrix = Matrix()
    if (rotationDegrees != 0) matrix.postRotate(rotationDegrees.toFloat())
    // Front camera frames need to be horizontally mirrored so the pose
    // landmark coordinates match the mirrored preview the user sees.
    if (facing == "front" && mirror) matrix.postScale(-1f, 1f)
    val rotated = if (!matrix.isIdentity) {
      Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    } else {
      bitmap
    }
    // Stash for takePicture(). The previous reference (if any) becomes
    // unreachable and is GC'd; we don't hold it any longer than necessary.
    latestBitmap = rotated
    return BitmapImageBuilder(rotated).build()
  }

  /// Save the most recent camera frame as a JPEG and return its file path.
  /// Returns null if no frame has been received yet.
  fun takePicture(): String? {
    val bitmap = latestBitmap ?: return null
    val ctx = appContext.reactContext ?: return null
    val file = File(ctx.cacheDir, "${UUID.randomUUID()}.jpg")
    return try {
      FileOutputStream(file).use { out ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, 70, out)
      }
      "file://${file.absolutePath}"
    } catch (error: Throwable) {
      Log.w(TAG, "takePicture failed", error)
      null
    }
  }
}
