export type LanguageCode = "en" | "es";

export type UserRole = "athlete" | "admin";

export type BikeType = "road" | "gravel" | "triathlon" | "mountain" | "hybrid";

export type TireWidthUnit = "mm" | "in";

export type TireSurface = "smooth" | "rough" | "gravel" | "wet" | "loose";

export type FitSessionType = "bike_fit" | "aero_analysis";

export type DeviceType = "web" | "ios" | "android";

export type CameraAngle = "side" | "front" | "rear";

export type FitSessionStatus = "draft" | "processing" | "completed" | "failed";

export type AnalysisType = "side_bike_fit" | "front_knee_tracking";

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

export type AdminAuthUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
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

export type TirePressureSetting = {
  id: string;
  user_id: string;
  bike_id: string | null;
  bike_type: BikeType;
  tire_width_mm: number;
  tire_width_unit: TireWidthUnit;
  rider_weight_kg: number;
  front_pressure_psi: number;
  rear_pressure_psi: number;
  surface_recommendations: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TirePressureInput = {
  bikeType: BikeType;
  riderWeightKg: number;
  tireWidth: number;
  tireWidthUnit: TireWidthUnit;
};

export type TireSurfaceRecommendation = {
  label: string;
  surface: TireSurface;
  frontPsi: number;
  rearPsi: number;
  note: string;
};

export type TirePressureRecommendation = {
  frontPsi: number;
  rearPsi: number;
  maxPsi: number;
  minPsi: number;
  normalizedTireWidthMm: number;
  surfaceRecommendations: TireSurfaceRecommendation[];
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

export type AnalysisSummary = {
  id: string;
  session_id: string;
  user_id: string;
  analysis_type: AnalysisType;
  title: string;
  overall_score: number | null;
  comfort_score: number | null;
  aero_score: number | null;
  confidence_score: number | null;
  duration_ms: number | null;
  sample_count: number | null;
  metrics: Record<string, unknown>;
  created_at: string;
};

export type FrontKneeMeasurement = {
  id: string;
  session_id: string;
  user_id: string;
  duration_ms: number | null;
  sample_count: number | null;
  estimated_mm_per_pixel: number | null;
  overall_score: number | null;
  confidence_score: number | null;
  left_horizontal_travel_mm: number | null;
  left_horizontal_travel_px: number | null;
  left_vertical_travel_mm: number | null;
  left_vertical_travel_px: number | null;
  left_knee_drift_mm: number | null;
  left_knee_drift_px: number | null;
  left_stability_score: number | null;
  left_confidence_score: number | null;
  left_sample_count: number | null;
  right_horizontal_travel_mm: number | null;
  right_horizontal_travel_px: number | null;
  right_vertical_travel_mm: number | null;
  right_vertical_travel_px: number | null;
  right_knee_drift_mm: number | null;
  right_knee_drift_px: number | null;
  right_stability_score: number | null;
  right_confidence_score: number | null;
  right_sample_count: number | null;
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

export type KneeTrackingPoint = {
  x: number;
  y: number;
  confidence: number;
};

export type FrontKneeTrackingSample = {
  timestampMs: number;
  leftAnkle?: KneeTrackingPoint;
  leftHip?: KneeTrackingPoint;
  leftKnee?: KneeTrackingPoint;
  rightAnkle?: KneeTrackingPoint;
  rightHip?: KneeTrackingPoint;
  rightKnee?: KneeTrackingPoint;
};

export type FrontKneeSideMetrics = {
  confidenceScore: number;
  horizontalTravelMm: number | null;
  horizontalTravelPx: number;
  kneeDriftMm: number | null;
  kneeDriftPx: number;
  sampleCount: number;
  stabilityScore: number;
  verticalTravelMm: number | null;
  verticalTravelPx: number;
};

export type FrontKneeTrackingResult = {
  confidenceScore: number;
  durationMs: number;
  estimatedMmPerPixel: number | null;
  left: FrontKneeSideMetrics;
  overallScore: number;
  recommendations: FitRecommendation[];
  right: FrontKneeSideMetrics;
  sampleCount: number;
};

export type AdminUserOverview = {
  authUser: AdminAuthUser;
  profile: UserProfile | null;
  isAdmin: boolean;
  bikesCount: number;
  analysesCount: number;
  latestAnalysisAt: string | null;
};

export type AdminUserDetail = AdminUserOverview & {
  aeroScores: AeroScore[];
  bikes: Bike[];
  fitMeasurements: FitMeasurement[];
  frontKneeMeasurements: FrontKneeMeasurement[];
  recommendations: Recommendation[];
  sessions: FitSession[];
  summaries: AnalysisSummary[];
};

export type AdminProfileUpdate = Partial<
  Pick<UserProfile, "email" | "name" | "preferred_language" | "gender" | "height_cm" | "weight_kg" | "date_of_birth">
>;

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

export type AnalysisHistoryItem = {
  aeroScore: AeroScore | null;
  fitMeasurement: FitMeasurement | null;
  frontKneeMeasurement: FrontKneeMeasurement | null;
  recommendations: Recommendation[];
  session: FitSession;
  summary: AnalysisSummary | null;
};
