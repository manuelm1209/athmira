import type { PoseKeypoint } from "@athmira/types";

import type { RawPoseLandmark } from "./PoseFrameResult";

// MediaPipe Pose Landmarker returns 33 landmarks. The rest of athmira's
// pose pipeline (overlay math, fit-engine, aero-engine, front-knee tracking)
// was built against the MoveNet / COCO-17 keypoint set. This table maps
// MediaPipe landmark indices (0-32) onto COCO-17 names so downstream code
// keeps working unchanged.
//
// Reference: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
// COCO-17 reference: https://cocodataset.org/#keypoints-2017
//
// Notes:
// - MediaPipe has finer face landmarks (eyes inner/outer, ears, mouth). We
//   only keep nose, left_eye, right_eye, left_ear, right_ear for COCO parity.
// - MediaPipe lacks the COCO "neck" point; that's fine, MoveNet doesn't
//   emit it either and our overlay math doesn't require it.
// - MediaPipe foot indices (29-32) are heel/foot_index — not used by COCO-17.
export const MEDIAPIPE_TO_COCO17: Record<number, string> = {
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
};

export const COCO17_KEYPOINT_NAMES = [
  "nose",
  "left_eye",
  "right_eye",
  "left_ear",
  "right_ear",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle"
] as const;

export type Coco17KeypointName = (typeof COCO17_KEYPOINT_NAMES)[number];

// Map a MediaPipe landmark output to the COCO-17 PoseKeypoint shape the
// rest of athmira expects.
//
// MediaPipe emits each landmark as (x, y, z, visibility, presence). We use
// `presence` for `confidence` because:
//   - `visibility` answers "is the landmark visible in the frame" (occlusion)
//   - `presence` answers "is the landmark actually there to detect"
// MoveNet's single `score` is closer to `presence` semantics — the model's
// confidence that the keypoint exists at the predicted location.
export function mapMediaPipePoseToCoco17(landmarks: RawPoseLandmark[]): PoseKeypoint[] {
  // The native side already names landmarks per the table above when it
  // emits them; this function just filters to the COCO-17 subset in case
  // the native side emits the full 33.
  const byName = new Map<string, RawPoseLandmark>();
  for (const landmark of landmarks) {
    byName.set(landmark.name, landmark);
  }

  const result: PoseKeypoint[] = [];
  for (const name of COCO17_KEYPOINT_NAMES) {
    const landmark = byName.get(name);
    if (!landmark) {
      continue;
    }
    result.push({
      name,
      x: landmark.x,
      y: landmark.y,
      confidence: landmark.confidence
    });
  }
  return result;
}
