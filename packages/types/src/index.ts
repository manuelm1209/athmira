export type LanguageCode = "en" | "es";

export type BikeType = "road" | "gravel" | "triathlon" | "mountain" | "hybrid";

export type FitSessionType = "bike_fit" | "aero_analysis";

export type DeviceType = "web" | "ios" | "android";

export type CameraAngle = "side" | "front" | "rear";

export type FitSessionStatus = "draft" | "processing" | "completed" | "failed";

export type RecommendationPriority = "low" | "medium" | "high";

export type RecommendationCategory =
  | "saddle_height"
  | "saddle_position"
  | "reach"
  | "torso"
  | "arms"
  | "head"
  | "comfort"
  | "aero";

export type MediaAssetType = "image" | "video" | "best_posture_snapshot";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  preferred_language: LanguageCode;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
};

export type Bike = {
  id: string;
  user_id: string;
  name: string;
  bike_type: BikeType;
  brand: string | null;
  model: string | null;
  size: string | null;
  saddle_height_mm: number | null;
  saddle_setback_mm: number | null;
  stem_length_mm: number | null;
  crank_length_mm: number | null;
  handlebar_width_mm: number | null;
  created_at: string;
  updated_at: string;
};

export type BikeInput = {
  name: string;
  bike_type: BikeType;
  brand?: string | null;
  model?: string | null;
  size?: string | null;
  saddle_height_mm?: number | null;
  saddle_setback_mm?: number | null;
  stem_length_mm?: number | null;
  crank_length_mm?: number | null;
  handlebar_width_mm?: number | null;
};

export type FitSession = {
  id: string;
  user_id: string;
  bike_id: string | null;
  session_type: FitSessionType;
  device_type: DeviceType;
  camera_angle: CameraAngle;
  status: FitSessionStatus;
  created_at: string;
};

export type FitMeasurement = {
  id: string;
  session_id: string;
  knee_angle_min: number | null;
  knee_angle_max: number | null;
  hip_angle_avg: number | null;
  torso_angle_avg: number | null;
  elbow_angle_avg: number | null;
  shoulder_angle_avg: number | null;
  confidence_score: number | null;
  created_at: string;
};

export type AeroScore = {
  id: string;
  session_id: string;
  estimated_frontal_area: number | null;
  torso_position_score: number | null;
  head_position_score: number | null;
  arm_compactness_score: number | null;
  stability_score: number | null;
  final_aero_score: number | null;
  created_at: string;
};

export type FitRecommendation = {
  priority: RecommendationPriority;
  category: RecommendationCategory;
  message: string;
  adjustmentMm?: number;
  confidenceScore: number;
};

export type Recommendation = {
  id: string;
  session_id: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  message: string;
  adjustment_mm: number | null;
  confidence_score: number | null;
  created_at: string;
};

export type MediaAsset = {
  id: string;
  session_id: string;
  user_id: string;
  type: MediaAssetType;
  storage_path: string;
  created_at: string;
};

export type PoseKeypoint = {
  name: string;
  x: number;
  y: number;
  confidence: number;
};

export type PoseFrame = {
  width: number;
  height: number;
  timestampMs?: number;
  sourceUri?: string;
};

export type JointAngles = {
  kneeAngle?: number;
  hipAngle?: number;
  torsoAngle?: number;
  elbowAngle?: number;
  shoulderAngle?: number;
};

export type PoseFrameResult = {
  keypoints: PoseKeypoint[];
  angles: JointAngles;
  confidenceScore: number;
  frame?: PoseFrame;
};

export type FitScore = {
  comfortScore: number;
  aeroScore: number;
  confidenceScore: number;
};

export type CalculatedAeroScore = {
  estimatedFrontalArea: number;
  torsoPositionScore: number;
  headPositionScore: number;
  armCompactnessScore: number;
  stabilityScore: number;
  finalAeroScore: number;
};
