import type {
  AnalysisType,
  BikeType,
  CameraAngle,
  DeviceType,
  FitSessionStatus,
  FitSessionType,
  LanguageCode,
  MediaAssetType,
  NutritionActivityType,
  NutritionIconKey,
  NutritionIntensity,
  NutritionPlanItemLocation,
  NutritionProductCategory,
  NutritionProductScope,
  NutritionTimingType,
  RecommendationCategory,
  RecommendationPriority,
  TireSetup,
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
          tire_setup: TireSetup;
          tire_width_value: number;
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
          tire_setup?: TireSetup;
          tire_width_value: number;
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
          tire_setup?: TireSetup;
          tire_width_value?: number;
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
      nutrition_plans: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          activity_type: NutritionActivityType;
          duration_minutes: number;
          intensity: NutritionIntensity;
          body_weight_kg: number | null;
          target_carbs_per_hour: number | null;
          target_fluids_ml_per_hour: number | null;
          target_sodium_mg_per_hour: number | null;
          estimated_calories_burned: number | null;
          total_planned_carbs: number;
          total_planned_fluids_ml: number;
          total_planned_sodium_mg: number;
          total_planned_calories: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          activity_type: NutritionActivityType;
          duration_minutes: number;
          intensity?: NutritionIntensity;
          body_weight_kg?: number | null;
          target_carbs_per_hour?: number | null;
          target_fluids_ml_per_hour?: number | null;
          target_sodium_mg_per_hour?: number | null;
          estimated_calories_burned?: number | null;
          total_planned_carbs?: number;
          total_planned_fluids_ml?: number;
          total_planned_sodium_mg?: number;
          total_planned_calories?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          activity_type?: NutritionActivityType;
          duration_minutes?: number;
          intensity?: NutritionIntensity;
          body_weight_kg?: number | null;
          target_carbs_per_hour?: number | null;
          target_fluids_ml_per_hour?: number | null;
          target_sodium_mg_per_hour?: number | null;
          estimated_calories_burned?: number | null;
          total_planned_carbs?: number;
          total_planned_fluids_ml?: number;
          total_planned_sodium_mg?: number;
          total_planned_calories?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      nutrition_products: {
        Row: {
          id: string;
          name: string;
          category: NutritionProductCategory;
          product_scope: NutritionProductScope;
          user_id: string | null;
          default_serving_size: number | null;
          default_serving_unit: string | null;
          carbs_per_serving: number;
          calories_per_serving: number;
          sodium_mg_per_serving: number;
          liquid_volume_ml_per_serving: number;
          weight_g_per_serving: number;
          icon_key: NutritionIconKey | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: NutritionProductCategory;
          product_scope: NutritionProductScope;
          user_id?: string | null;
          default_serving_size?: number | null;
          default_serving_unit?: string | null;
          carbs_per_serving?: number;
          calories_per_serving?: number;
          sodium_mg_per_serving?: number;
          liquid_volume_ml_per_serving?: number;
          weight_g_per_serving?: number;
          icon_key?: NutritionIconKey | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          category?: NutritionProductCategory;
          product_scope?: NutritionProductScope;
          user_id?: string | null;
          default_serving_size?: number | null;
          default_serving_unit?: string | null;
          carbs_per_serving?: number;
          calories_per_serving?: number;
          sodium_mg_per_serving?: number;
          liquid_volume_ml_per_serving?: number;
          weight_g_per_serving?: number;
          icon_key?: NutritionIconKey | null;
          notes?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      nutrition_plan_bottles: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          name: string | null;
          bottle_size_ml: number;
          bottle_size_label: string | null;
          display_order: number;
          total_used_volume_ml: number;
          remaining_water_ml: number;
          total_carbs: number;
          total_sodium_mg: number;
          total_calories: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          name?: string | null;
          bottle_size_ml: number;
          bottle_size_label?: string | null;
          display_order?: number;
          total_used_volume_ml?: number;
          remaining_water_ml?: number;
          total_carbs?: number;
          total_sodium_mg?: number;
          total_calories?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string | null;
          bottle_size_ml?: number;
          bottle_size_label?: string | null;
          display_order?: number;
          total_used_volume_ml?: number;
          remaining_water_ml?: number;
          total_carbs?: number;
          total_sodium_mg?: number;
          total_calories?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      nutrition_plan_items: {
        Row: {
          id: string;
          plan_id: string;
          bottle_id: string | null;
          user_id: string;
          product_id: string;
          quantity: number;
          unit: string | null;
          serving_multiplier: number;
          location: NutritionPlanItemLocation;
          timing_type: NutritionTimingType | null;
          timing_minute: number | null;
          calculated_carbs: number;
          calculated_calories: number;
          calculated_sodium_mg: number;
          calculated_volume_ml: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          bottle_id?: string | null;
          user_id: string;
          product_id: string;
          quantity: number;
          unit?: string | null;
          serving_multiplier?: number;
          location: NutritionPlanItemLocation;
          timing_type?: NutritionTimingType | null;
          timing_minute?: number | null;
          calculated_carbs?: number;
          calculated_calories?: number;
          calculated_sodium_mg?: number;
          calculated_volume_ml?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bottle_id?: string | null;
          product_id?: string;
          quantity?: number;
          unit?: string | null;
          serving_multiplier?: number;
          location?: NutritionPlanItemLocation;
          timing_type?: NutritionTimingType | null;
          timing_minute?: number | null;
          calculated_carbs?: number;
          calculated_calories?: number;
          calculated_sodium_mg?: number;
          calculated_volume_ml?: number;
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
