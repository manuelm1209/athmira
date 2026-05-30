package expo.modules.poselandmarker

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.net.Uri
import android.util.Log
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

// MediaPipe Pose Landmarker → COCO-17 mapping. Mirrors
// MEDIAPIPE_TO_COCO17 in landmarkMapping.ts and mediaPipeIndexToCoco17 in
// ExpoPoseLandmarkerModule.swift. Keep all three in lockstep.
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

private const val TAG = "ExpoPoseLandmarker"
private const val MODEL_ASSET_NAME = "pose_landmarker_lite.task"

class ExpoPoseLandmarkerModule : Module() {
  private var landmarker: PoseLandmarker? = null
  private var activeDelegate: Delegate = Delegate.GPU

  override fun definition() = ModuleDefinition {
    Name("ExpoPoseLandmarkerModule")

    OnCreate {
      try {
        initializeLandmarker()
      } catch (error: Throwable) {
        Log.e(TAG, "init failed", error)
      }
    }

    OnDestroy {
      landmarker?.close()
      landmarker = null
    }

    AsyncFunction("detectPoseFromUri") { uri: String, promise: Promise ->
      val current = landmarker
      if (current == null) {
        promise.reject("E_NOT_READY", "PoseLandmarker is not initialized", null)
        return@AsyncFunction
      }

      val bitmap = loadBitmap(uri)
      if (bitmap == null) {
        promise.reject("E_IMAGE_LOAD", "Could not load image at $uri", null)
        return@AsyncFunction
      }

      val mpImage = BitmapImageBuilder(bitmap).build()
      val startedAt = System.nanoTime()

      try {
        val result = current.detect(mpImage)
        val inferenceMs = (System.nanoTime() - startedAt) / 1_000_000.0

        val firstPose = result.landmarks().firstOrNull()
        if (firstPose == null) {
          promise.resolve(null)
          return@AsyncFunction
        }

        val landmarks = mutableListOf<Map<String, Any>>()
        firstPose.forEachIndexed { index, landmark ->
          val name = MEDIAPIPE_TO_COCO17[index] ?: return@forEachIndexed
          // MediaPipe Android returns visibility/presence as Optional<Float>.
          // Prefer presence (model confidence) over visibility (occlusion).
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

        promise.resolve(
          mapOf(
            "landmarks" to landmarks,
            "imageWidth" to bitmap.width.toDouble(),
            "imageHeight" to bitmap.height.toDouble(),
            "inferenceMs" to inferenceMs,
            "delegate" to if (activeDelegate == Delegate.GPU) "gpu" else "cpu"
          )
        )
      } catch (error: Throwable) {
        promise.reject("E_DETECT", error.message ?: "Unknown detection error", error)
      } finally {
        if (!bitmap.isRecycled) bitmap.recycle()
      }
    }

    AsyncFunction("warmUp") { promise: Promise ->
      val current = landmarker
      if (current == null) {
        promise.resolve(null)
        return@AsyncFunction
      }
      val warmUpBitmap = Bitmap.createBitmap(192, 192, Bitmap.Config.ARGB_8888).apply {
        Canvas(this).drawColor(Color.BLACK)
      }
      try {
        current.detect(BitmapImageBuilder(warmUpBitmap).build())
      } catch (error: Throwable) {
        Log.w(TAG, "warmUp inference failed", error)
      } finally {
        if (!warmUpBitmap.isRecycled) warmUpBitmap.recycle()
      }
      promise.resolve(null)
    }

    Function("getActiveDelegate") {
      if (activeDelegate == Delegate.GPU) "gpu" else "cpu"
    }
  }

  // MARK: - Private helpers

  private fun initializeLandmarker() {
    val context = appContext.reactContext
      ?: throw IllegalStateException("React context unavailable")

    fun build(delegate: Delegate): PoseLandmarker {
      val baseOptions = BaseOptions.builder()
        .setModelAssetPath(MODEL_ASSET_NAME)
        .setDelegate(delegate)
        .build()
      val options = PoseLandmarker.PoseLandmarkerOptions.builder()
        .setBaseOptions(baseOptions)
        .setRunningMode(RunningMode.IMAGE)
        .setNumPoses(1)
        .setMinPoseDetectionConfidence(0.5f)
        .setMinPosePresenceConfidence(0.5f)
        .setMinTrackingConfidence(0.5f)
        .build()
      return PoseLandmarker.createFromOptions(context, options)
    }

    landmarker = try {
      activeDelegate = Delegate.GPU
      build(Delegate.GPU)
    } catch (error: Throwable) {
      Log.w(TAG, "GPU delegate failed, falling back to CPU", error)
      activeDelegate = Delegate.CPU
      build(Delegate.CPU)
    }
    Log.i(TAG, "initialized with delegate: $activeDelegate")
  }

  private fun loadBitmap(uri: String): Bitmap? {
    val parsed = Uri.parse(uri)
    val path = if (parsed.scheme == "file") parsed.path else uri
    if (path.isNullOrEmpty()) return null
    val file = File(path)
    if (!file.exists()) return null
    return BitmapFactory.decodeFile(file.absolutePath)
  }
}
