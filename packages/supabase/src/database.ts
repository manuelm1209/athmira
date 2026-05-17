import type {
  AnalysisType,
  BikeType,
  CameraAngle,
  DeviceType,
  FitSessionStatus,
  FitSessionType,
  LanguageCode,
  MediaAssetType,
  RecommendationCategory,
  RecommendationPriority,
  TireWidthUnit
} from "@athmira/types";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          preferred_language?: LanguageCode;
          gender?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          date_of_birth?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          name?: string | null;
          preferred_language?: LanguageCode;
          gender?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          date_of_birth?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_roles: {
        Row: {
          user_id: string;
          role: "admin";
          granted_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: "admin";
          granted_by?: string | null;
          created_at?: string;
        };
        Update: {
          role?: "admin";
          granted_by?: string | null;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          admin_user_id: string | null;
          target_user_id: string | null;
          action: "create_user" | "grant_admin" | "revoke_admin" | "set_temporary_password" | "update_user_profile";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id?: string | null;
          target_user_id?: string | null;
          action: "create_user" | "grant_admin" | "revoke_admin" | "set_temporary_password" | "update_user_profile";
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          metadata?: Json;
        };
        Relationships: [];
      };
      bikes: {
        Row: {
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
        Insert: {
          id?: string;
          user_id: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          bike_type?: BikeType;
          brand?: string | null;
          model?: string | null;
          size?: string | null;
          saddle_height_mm?: number | null;
          saddle_setback_mm?: number | null;
          stem_length_mm?: number | null;
          crank_length_mm?: number | null;
          handlebar_width_mm?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tire_pressure_settings: {
        Row: {
          id: string;
          user_id: string;
          bike_id: string | null;
          bike_type: BikeType;
          tire_width_mm: number;
          tire_width_unit: TireWidthUnit;
          rider_weight_kg: number;
          front_pressure_psi: number;
          rear_pressure_psi: number;
          surface_recommendations: Json;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bike_id?: string | null;
          bike_type: BikeType;
          tire_width_mm: number;
          tire_width_unit?: TireWidthUnit;
          rider_weight_kg: number;
          front_pressure_psi: number;
          rear_pressure_psi: number;
          surface_recommendations?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bike_id?: string | null;
          bike_type?: BikeType;
          tire_width_mm?: number;
          tire_width_unit?: TireWidthUnit;
          rider_weight_kg?: number;
          front_pressure_psi?: number;
          rear_pressure_psi?: number;
          surface_recommendations?: Json;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      fit_sessions: {
        Row: {
          id: string;
          user_id: string;
          bike_id: string | null;
          session_type: FitSessionType;
          device_type: DeviceType;
          camera_angle: CameraAngle;
          status: FitSessionStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bike_id?: string | null;
          session_type: FitSessionType;
          device_type: DeviceType;
          camera_angle?: CameraAngle;
          status?: FitSessionStatus;
          created_at?: string;
        };
        Update: {
          bike_id?: string | null;
          session_type?: FitSessionType;
          device_type?: DeviceType;
          camera_angle?: CameraAngle;
          status?: FitSessionStatus;
        };
        Relationships: [];
      };
      fit_measurements: {
        Row: {
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
        Insert: {
          id?: string;
          session_id: string;
          knee_angle_min?: number | null;
          knee_angle_max?: number | null;
          hip_angle_avg?: number | null;
          torso_angle_avg?: number | null;
          elbow_angle_avg?: number | null;
          shoulder_angle_avg?: number | null;
          confidence_score?: number | null;
          created_at?: string;
        };
        Update: {
          knee_angle_min?: number | null;
          knee_angle_max?: number | null;
          hip_angle_avg?: number | null;
          torso_angle_avg?: number | null;
          elbow_angle_avg?: number | null;
          shoulder_angle_avg?: number | null;
          confidence_score?: number | null;
        };
        Relationships: [];
      };
      aero_scores: {
        Row: {
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
        Insert: {
          id?: string;
          session_id: string;
          estimated_frontal_area?: number | null;
          torso_position_score?: number | null;
          head_position_score?: number | null;
          arm_compactness_score?: number | null;
          stability_score?: number | null;
          final_aero_score?: number | null;
          created_at?: string;
        };
        Update: {
          estimated_frontal_area?: number | null;
          torso_position_score?: number | null;
          head_position_score?: number | null;
          arm_compactness_score?: number | null;
          stability_score?: number | null;
          final_aero_score?: number | null;
        };
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string;
          session_id: string;
          priority: RecommendationPriority;
          category: RecommendationCategory;
          message: string;
          adjustment_mm: number | null;
          confidence_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          priority: RecommendationPriority;
          category: RecommendationCategory;
          message: string;
          adjustment_mm?: number | null;
          confidence_score?: number | null;
          created_at?: string;
        };
        Update: {
          priority?: RecommendationPriority;
          category?: RecommendationCategory;
          message?: string;
          adjustment_mm?: number | null;
          confidence_score?: number | null;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          type: MediaAssetType;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          type: MediaAssetType;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          type?: MediaAssetType;
          storage_path?: string;
        };
        Relationships: [];
      };
      analysis_summaries: {
        Row: {
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
          metrics: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          analysis_type: AnalysisType;
          title: string;
          overall_score?: number | null;
          comfort_score?: number | null;
          aero_score?: number | null;
          confidence_score?: number | null;
          duration_ms?: number | null;
          sample_count?: number | null;
          metrics?: Json;
          created_at?: string;
        };
        Update: {
          analysis_type?: AnalysisType;
          title?: string;
          overall_score?: number | null;
          comfort_score?: number | null;
          aero_score?: number | null;
          confidence_score?: number | null;
          duration_ms?: number | null;
          sample_count?: number | null;
          metrics?: Json;
        };
        Relationships: [];
      };
      front_knee_measurements: {
        Row: {
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
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          duration_ms?: number | null;
          sample_count?: number | null;
          estimated_mm_per_pixel?: number | null;
          overall_score?: number | null;
          confidence_score?: number | null;
          left_horizontal_travel_mm?: number | null;
          left_horizontal_travel_px?: number | null;
          left_vertical_travel_mm?: number | null;
          left_vertical_travel_px?: number | null;
          left_knee_drift_mm?: number | null;
          left_knee_drift_px?: number | null;
          left_stability_score?: number | null;
          left_confidence_score?: number | null;
          left_sample_count?: number | null;
          right_horizontal_travel_mm?: number | null;
          right_horizontal_travel_px?: number | null;
          right_vertical_travel_mm?: number | null;
          right_vertical_travel_px?: number | null;
          right_knee_drift_mm?: number | null;
          right_knee_drift_px?: number | null;
          right_stability_score?: number | null;
          right_confidence_score?: number | null;
          right_sample_count?: number | null;
          created_at?: string;
        };
        Update: {
          duration_ms?: number | null;
          sample_count?: number | null;
          estimated_mm_per_pixel?: number | null;
          overall_score?: number | null;
          confidence_score?: number | null;
          left_horizontal_travel_mm?: number | null;
          left_horizontal_travel_px?: number | null;
          left_vertical_travel_mm?: number | null;
          left_vertical_travel_px?: number | null;
          left_knee_drift_mm?: number | null;
          left_knee_drift_px?: number | null;
          left_stability_score?: number | null;
          left_confidence_score?: number | null;
          left_sample_count?: number | null;
          right_horizontal_travel_mm?: number | null;
          right_horizontal_travel_px?: number | null;
          right_vertical_travel_mm?: number | null;
          right_vertical_travel_px?: number | null;
          right_knee_drift_mm?: number | null;
          right_knee_drift_px?: number | null;
          right_stability_score?: number | null;
          right_confidence_score?: number | null;
          right_sample_count?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
