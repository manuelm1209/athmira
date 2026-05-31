# expo-pose-landmarker

Local Expo Module that wraps Google MediaPipe Pose Landmarker on iOS (Metal GPU delegate) and Android (GPU delegate), so athmira's `/analysis` flows can hit ~25–30 FPS native pose detection without depending on `react-native-vision-camera`, `react-native-worklets`, or `fast-tflite` — all of which are blocked on the upstream `folly/coro/Coroutine.h` bug on RN 0.83/0.85.

## One-time setup

This module needs the MediaPipe Pose Landmarker (Lite) `.task` file. The binary is ~5 MB and not committed.

Download from Google's CDN:

```sh
curl -L -o pose_landmarker_lite.task \
  https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
```

Then copy it into both platform bundles:

```sh
mkdir -p apps/app/modules/expo-pose-landmarker/ios/Resources
mkdir -p apps/app/modules/expo-pose-landmarker/android/src/main/assets
cp pose_landmarker_lite.task apps/app/modules/expo-pose-landmarker/ios/Resources/
cp pose_landmarker_lite.task apps/app/modules/expo-pose-landmarker/android/src/main/assets/
```

Both copies are gitignored — see `.gitignore` at the module root.

## How it's wired

Both platforms discover this module automatically through **Expo Modules Autolinking** — no manual edits to `apps/app/ios/Podfile` or `apps/app/android/settings.gradle` are needed. The autolinking scanner finds the module via `apps/app/modules/expo-pose-landmarker/expo-module.config.json` and `package.json` and wires it into the app's Pods / Gradle graph on the next `pod install` / Gradle sync.

- iOS: `MediaPipeTasksVision` Cocoapod (declared in `ios/ExpoPoseLandmarker.podspec`). Runs Metal GPU delegate by default; falls back to CPU silently on unsupported devices. After adding/changing native code: `npm run ios:pods` from the repo root, or just re-run `npm run ios`.
- Android: `com.google.mediapipe:tasks-vision:0.10.x` Gradle dep (declared in `android/build.gradle`). Same GPU → CPU fallback. After adding/changing native code: `npm run android` re-syncs Gradle and recompiles the module.
- TS facade (`src/index.ts`) exposes two APIs:
  - **Live-stream (canonical for `/analysis` flows):** `<PoseLandmarkerView />` — owns the AVCaptureSession (iOS) / CameraX (Android) pipeline and emits poses through `onPose` at the device's native frame rate (~25-30 FPS).
  - **Single-frame (legacy polling):** `detectPoseFromUri(uri)` for snapshots, plus `warmUp()` and `getActiveDelegate()`.

## After installing the model

athmira is in Expo's **bare workflow** — `apps/app/ios/` and `apps/app/android/` are committed and edited directly. Builds run locally; there's no EAS Build dependency for this module. **Never run `expo prebuild`** on this repo (it would overwrite committed native config). See the root [README "Running the app"](../../../../README.md#running-the-app) for the full command table.

From the repo root, with the model file in place:

```sh
# iOS Simulator — fast UI iteration. MediaPipe falls back to CPU here,
# so do not benchmark pose detection on the simulator.
npm run ios

# iOS physical device — required for real frame rate, Metal GPU delegate,
# and thermal benchmarks. iOS 26+ devices need the Xcode/devicectl
# workaround documented in the root README.
npm run ios:device     # (or: npm run ios:xcode → ⌘R)

# Android — emulator or any connected device with USB debugging.
npm run android        # (or: npm run android:studio → Run)
```

Expo Go cannot load this module — it ships native Swift/Kotlin code. The bare workflow above is sufficient; the local Expo Module is autolinked into the bundled dev client automatically, no extra config required.

## Public API

```ts
import { detectPoseFromUri, warmUp, getActiveDelegate } from "expo-pose-landmarker";

await warmUp(); // run once after the camera mounts; primes the Metal pipeline

const { pose, inferenceMs, delegate } = await detectPoseFromUri(snapshot.uri);
// pose: PoseFrameResult | null   (normalized [0,1] coords, COCO-17 names)
// inferenceMs: number             (~15-25 ms on iPhone 12+, ~20-30 ms on Pixel 6+)
// delegate: "gpu" | "cpu"         (log when "cpu" — performance will be worse)
```

`PoseFrameResult` is the same type the SVG overlays and `fit-engine` already consume, so the downstream pipeline is unchanged.

## Landmark mapping

MediaPipe emits 33 landmarks; athmira's overlay math and fit-engine target the MoveNet / COCO-17 set. The 33→17 mapping lives in three places — keep them in lockstep when changing:

- `src/landmarkMapping.ts` (TS, used by the facade for type safety)
- `ios/ExpoPoseLandmarkerModule.swift` (`mediaPipeIndexToCoco17` dictionary)
- `android/src/main/java/expo/modules/poselandmarker/ExpoPoseLandmarkerModule.kt` (`MEDIAPIPE_TO_COCO17` map)
