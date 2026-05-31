# MoveNet TFLite model — **LEGACY / UNUSED**

> **This path is no longer active.** Native pose detection runs through
> the local `expo-pose-landmarker` Expo Module (MediaPipe with Metal/GPU
> delegates). See
> [`apps/app/modules/expo-pose-landmarker/README.md`](../../modules/expo-pose-landmarker/README.md)
> for the current setup.
>
> This file is kept only for reference until the legacy TFLite polling
> path is fully removed. No `npm run` script in the bare-workflow setup
> depends on the MoveNet model. Skip the rest of this README unless
> you're explicitly maintaining the legacy code path.

Historically the native (iOS / Android) bike fit and front knee cameras
ran real-time pose detection through `react-native-fast-tflite` using
Google's MoveNet Single-Pose Lightning model. That stack hit known
worklets/folly issues on RN 0.83 and was replaced by MediaPipe Tasks
Vision.

The model file is intentionally **not** committed to this repository: it
is a binary asset and is fetched from Google's official TF Hub host.

## Required file (legacy)

Place a file named exactly:

```
apps/app/assets/models/movenet_singlepose_lightning.tflite
```

Only required if you re-enable the legacy MoveNet pipeline. The
production camera flows do not need it.

## Download

The historical TF Hub bucket
(`storage.googleapis.com/tfhub-lite-models/...`) is no longer publicly
readable — Google migrated TF Hub to Kaggle. Use one of the two
mirrors below.

### Option A — `tensorflow/examples` GitHub mirror (no login)

```sh
curl -L -o apps/app/assets/models/movenet_singlepose_lightning.tflite \
  https://github.com/tensorflow/examples/raw/master/lite/examples/pose_estimation/raspberry_pi/movenet_lightning.tflite
```

### Option B — Kaggle (requires a free account + license acceptance)

https://www.kaggle.com/models/google/movenet/tfLite/singlepose-lightning

Download the `.tflite` file and rename it to
`movenet_singlepose_lightning.tflite` in this folder.

### Verify the download

```sh
ls -lh apps/app/assets/models/movenet_singlepose_lightning.tflite
file apps/app/assets/models/movenet_singlepose_lightning.tflite
```

The file must be ~9 MB. If it is ~200 bytes, you downloaded an XML
error page — delete it and retry.

## Notes

- Input shape: `[1, 192, 192, 3]`, `uint8` (converted from `float16` at
  load time by TFLite).
- Output shape: `[1, 1, 17, 3]` — 17 keypoints, each `(y, x, score)`
  normalised to `[0, 1]`.
- The model is licensed under Apache 2.0 (Google).

If you want to swap in the higher-accuracy Thunder variant
(`movenet_thunder.tflite`, 256×256 input, ~3× slower), download it
from the same `tensorflow/examples` folder or from Kaggle and update
the `require(...)` in `useMoveNetDetector.ts`.
