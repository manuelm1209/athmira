import type { JointAngles, PoseKeypoint } from "@athmira/types";

export const SKELETON_COLOR = "#b7e64a";
export const SKELETON_GLOW = "rgba(183, 230, 74, 0.55)";
export const LABEL_BG = "rgba(13, 27, 34, 0.92)";
export const LABEL_BORDER = "rgba(183, 230, 74, 0.85)";
export const PATH_COLOR = "rgba(239, 113, 95, 0.85)";

export const POSE_CONFIDENCE_THRESHOLD = 0.35;
export const KEYPOINT_CONFIDENCE_THRESHOLD = 0.35;

export function findKeypoint(
  keypoints: PoseKeypoint[],
  name: string,
  threshold = KEYPOINT_CONFIDENCE_THRESHOLD
): PoseKeypoint | undefined {
  return keypoints.find((keypoint) => keypoint.name === name && keypoint.confidence >= threshold);
}

export type BikeFitBadge = {
  direction: "left" | "right" | "up" | "down";
  label: string;
  pointName: string;
  value: number | undefined;
};

export function bikeFitBadges(side: "left" | "right", angles: JointAngles): BikeFitBadge[] {
  return [
    { direction: "right", label: "Knee", pointName: `${side}_knee`, value: angles.kneeAngle },
    { direction: "left", label: "Hip", pointName: `${side}_hip`, value: angles.hipAngle },
    { direction: "up", label: "Torso", pointName: `${side}_shoulder`, value: angles.torsoAngle },
    { direction: "right", label: "Elbow", pointName: `${side}_elbow`, value: angles.elbowAngle }
  ];
}

export const BIKE_FIT_SEGMENTS = (side: "left" | "right"): [string, string][] => [
  [`${side}_shoulder`, `${side}_elbow`],
  [`${side}_elbow`, `${side}_wrist`],
  [`${side}_shoulder`, `${side}_hip`],
  [`${side}_hip`, `${side}_knee`],
  [`${side}_knee`, `${side}_ankle`]
];

export const BIKE_FIT_JOINT_NAMES = (side: "left" | "right"): string[] => [
  `${side}_shoulder`,
  `${side}_elbow`,
  `${side}_wrist`,
  `${side}_hip`,
  `${side}_knee`,
  `${side}_ankle`
];

export function scalePoint(point: { x: number; y: number }, width: number, height: number) {
  return { x: point.x * width, y: point.y * height };
}
