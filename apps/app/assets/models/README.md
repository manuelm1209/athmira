# MoveNet TFLite model

The native (iOS / Android) bike fit and front knee cameras run real-time
pose detection through `react-native-fast-tflite` using Google's MoveNet
Single-Pose Lightning model.

The model file is intentionally **not** committed to this repository: it
is a binary asset and is fetched from Google's official TF Hub host.

## Required file

Place a file named exactly:

```
apps/app/assets/models/movenet_singlepose_lightning.tflite
```

This file must be present **before** running `npm run native:prebuild`
or any EAS build, otherwise Metro will fail to bundle the native apps.

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
