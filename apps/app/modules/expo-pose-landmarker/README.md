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

- iOS: `MediaPipeTasksVision` Cocoapod (declared in `ios/ExpoPoseLandmarker.podspec`). Runs Metal GPU delegate by default; falls back to CPU silently on unsupported devices.
- Android: `com.google.mediapipe:tasks-vision:0.10.x` Gradle dep. Same GPU → CPU fallback.
- TS facade (`src/index.ts`) exposes `detectPoseFromUri`, `warmUp`, and `getActiveDelegate`.

## After installing the model

```sh
cd apps/app
npm run native:prebuild

# Physical iPhone/iPad — required for real frame rate, GPU/Metal,
# and thermal benchmarks. MediaPipe runs on the Metal delegate here.
eas build --profile development --platform ios

# iOS Simulator only — fine for UI/navigation iteration, but MediaPipe
# falls back to CPU on the simulator. Do not measure performance here.
eas build --profile development-simulator --platform ios

# Android phones (APK with dev client)
eas build --profile development --platform android
```

Expo Go cannot load this module — you need a dev build. See `apps/app/eas.json` for the full profile list (`development`, `development-simulator`, `preview`, `production`).

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
