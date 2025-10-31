export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attempts: {
        Row: {
          attempt_number: number | null
          confidence: number | null
          confidence_0_1: number | null
          correct: boolean
          created_at: string
          hesitation_count: number | null
          id: string
          mode: string | null
          option_switches: number | null
          pressure_mode: string | null
          question_id: string
          revisited: boolean | null
          time_taken: number
          time_taken_ms: number | null
          ui_variant: string | null
          user_id: string
        }
        Insert: {
          attempt_number?: number | null
          confidence?: number | null
          confidence_0_1?: number | null
          correct: boolean
          created_at?: string
          hesitation_count?: number | null
          id?: string
          mode?: string | null
          option_switches?: number | null
          pressure_mode?: string | null
          question_id: string
          revisited?: boolean | null
          time_taken: number
          time_taken_ms?: number | null
          ui_variant?: string | null
          user_id: string
        }
        Update: {
          attempt_number?: number | null
          confidence?: number | null
          confidence_0_1?: number | null
          correct?: boolean
          created_at?: string
          hesitation_count?: number | null
          id?: string
          mode?: string | null
          option_switches?: number | null
          pressure_mode?: string | null
          question_id?: string
          revisited?: boolean | null
          time_taken?: number
          time_taken_ms?: number | null
          ui_variant?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concepts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_results: {
        Row: {
          confidence: number | null
          correct: boolean
          hesitation_count: number | null
          id: string
          question_id: string
          revisit_count: number | null
          submitted_at: string
          time_taken: number
          user_id: string
        }
        Insert: {
          confidence?: number | null
          correct: boolean
          hesitation_count?: number | null
          id?: string
          question_id: string
          revisit_count?: number | null
          submitted_at?: string
          time_taken: number
          user_id: string
        }
        Update: {
          confidence?: number | null
          correct?: boolean
          hesitation_count?: number | null
          id?: string
          question_id?: string
          revisit_count?: number | null
          submitted_at?: string
          time_taken?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_results_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_presets: {
        Row: {
          calibration_preset_json: Json | null
          created_at: string
          exam_id: string
          id: string
        }
        Insert: {
          calibration_preset_json?: Json | null
          created_at?: string
          exam_id: string
          id?: string
        }
        Update: {
          calibration_preset_json?: Json | null
          created_at?: string
          exam_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_presets_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sections: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          name: string
          order_index: number
          weight: number | null
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          name: string
          order_index: number
          weight?: number | null
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          name?: string
          order_index?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_sections_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          alias: string[] | null
          created_at: string
          duration_min: number | null
          id: string
          level: string | null
          name: string
          negative_marking_json: Json | null
        }
        Insert: {
          alias?: string[] | null
          created_at?: string
          duration_min?: number | null
          id?: string
          level?: string | null
          name: string
          negative_marking_json?: Json | null
        }
        Update: {
          alias?: string[] | null
          created_at?: string
          duration_min?: number | null
          id?: string
          level?: string | null
          name?: string
          negative_marking_json?: Json | null
        }
        Relationships: []
      }
      feature_user_daily: {
        Row: {
          acc_ema_long: number | null
          acc_ema_short: number | null
          calibration_progress_0_1: number | null
          cdna_embed: number[] | null
          created_at: string
          fatigue_index: number | null
          id: string
          latency_ema_long: number | null
          latency_ema_short: number | null
          mastery_vector: Json | null
          miscalibration_ema: number | null
          pressure_sensitivity: number | null
          skip_rate_win20: number | null
          snapshot_date: string
          strategy_strengths_json: Json | null
          switch_cost: number | null
          user_id: string
        }
        Insert: {
          acc_ema_long?: number | null
          acc_ema_short?: number | null
          calibration_progress_0_1?: number | null
          cdna_embed?: number[] | null
          created_at?: string
          fatigue_index?: number | null
          id?: string
          latency_ema_long?: number | null
          latency_ema_short?: number | null
          mastery_vector?: Json | null
          miscalibration_ema?: number | null
          pressure_sensitivity?: number | null
          skip_rate_win20?: number | null
          snapshot_date: string
          strategy_strengths_json?: Json | null
          switch_cost?: number | null
          user_id: string
        }
        Update: {
          acc_ema_long?: number | null
          acc_ema_short?: number | null
          calibration_progress_0_1?: number | null
          cdna_embed?: number[] | null
          created_at?: string
          fatigue_index?: number | null
          id?: string
          latency_ema_long?: number | null
          latency_ema_short?: number | null
          mastery_vector?: Json | null
          miscalibration_ema?: number | null
          pressure_sensitivity?: number | null
          skip_rate_win20?: number | null
          snapshot_date?: string
          strategy_strengths_json?: Json | null
          switch_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_user_daily_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_user_exam_daily: {
        Row: {
          acc_ema_long: number | null
          acc_ema_short: number | null
          calibration_progress_0_1: number | null
          cdna_embed: number[] | null
          created_at: string
          exam_id: string
          fatigue_index: number | null
          id: string
          latency_ema_long: number | null
          latency_ema_short: number | null
          mastery_vector: Json | null
          miscalibration_ema: number | null
          pressure_sensitivity: number | null
          snapshot_date: string
          strategy_strengths_json: Json | null
          switch_cost: number | null
          user_id: string
        }
        Insert: {
          acc_ema_long?: number | null
          acc_ema_short?: number | null
          calibration_progress_0_1?: number | null
          cdna_embed?: number[] | null
          created_at?: string
          exam_id: string
          fatigue_index?: number | null
          id?: string
          latency_ema_long?: number | null
          latency_ema_short?: number | null
          mastery_vector?: Json | null
          miscalibration_ema?: number | null
          pressure_sensitivity?: number | null
          snapshot_date: string
          strategy_strengths_json?: Json | null
          switch_cost?: number | null
          user_id: string
        }
        Update: {
          acc_ema_long?: number | null
          acc_ema_short?: number | null
          calibration_progress_0_1?: number | null
          cdna_embed?: number[] | null
          created_at?: string
          exam_id?: string
          fatigue_index?: number | null
          id?: string
          latency_ema_long?: number | null
          latency_ema_short?: number | null
          mastery_vector?: Json | null
          miscalibration_ema?: number | null
          pressure_sensitivity?: number | null
          snapshot_date?: string
          strategy_strengths_json?: Json | null
          switch_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_user_exam_daily_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          id: string
          path_json: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          path_json?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          path_json?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_eval_queue: {
        Row: {
          created_at: string
          id: string
          justification_id: string
          payload_json: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          justification_id: string
          payload_json?: Json | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          justification_id?: string
          payload_json?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_eval_queue_justification_id_fkey"
            columns: ["justification_id"]
            isOneToOne: false
            referencedRelation: "user_justifications"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_eval_results: {
        Row: {
          coherence_0_1: number | null
          created_at: string
          error_class: string | null
          features_json: Json | null
          id: string
          jqs_0_1: number | null
          justification_id: string
          reasoning_style: string | null
          step_count: number | null
          strategy_primary: string | null
          strategy_secondary: string[] | null
        }
        Insert: {
          coherence_0_1?: number | null
          created_at?: string
          error_class?: string | null
          features_json?: Json | null
          id?: string
          jqs_0_1?: number | null
          justification_id: string
          reasoning_style?: string | null
          step_count?: number | null
          strategy_primary?: string | null
          strategy_secondary?: string[] | null
        }
        Update: {
          coherence_0_1?: number | null
          created_at?: string
          error_class?: string | null
          features_json?: Json | null
          id?: string
          jqs_0_1?: number | null
          justification_id?: string
          reasoning_style?: string | null
          step_count?: number | null
          strategy_primary?: string | null
          strategy_secondary?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_eval_results_justification_id_fkey"
            columns: ["justification_id"]
            isOneToOne: false
            referencedRelation: "user_justifications"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_logs: {
        Row: {
          action_json: Json
          chosen_question_id: string | null
          context_json: Json
          created_at: string
          id: string
          propensity: number | null
          reward: number | null
          user_id: string
        }
        Insert: {
          action_json: Json
          chosen_question_id?: string | null
          context_json: Json
          created_at?: string
          id?: string
          propensity?: number | null
          reward?: number | null
          user_id: string
        }
        Update: {
          action_json?: Json
          chosen_question_id?: string | null
          context_json?: Json
          created_at?: string
          id?: string
          propensity?: number | null
          reward?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_logs_chosen_question_id_fkey"
            columns: ["chosen_question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cognitive_profile: Json | null
          created_at: string
          email: string
          exam_type: string
          id: string
          name: string
        }
        Insert: {
          cognitive_profile?: Json | null
          created_at?: string
          email: string
          exam_type: string
          id: string
          name: string
        }
        Update: {
          cognitive_profile?: Json | null
          created_at?: string
          email?: string
          exam_type?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          concept_tag: string
          correct_option: string
          created_at: string
          difficulty: number | null
          format_type: string | null
          id: string
          options: Json
          reading_len: number | null
          text: string
        }
        Insert: {
          concept_tag: string
          correct_option: string
          created_at?: string
          difficulty?: number | null
          format_type?: string | null
          id?: string
          options: Json
          reading_len?: number | null
          text: string
        }
        Update: {
          concept_tag?: string
          correct_option?: string
          created_at?: string
          difficulty?: number | null
          format_type?: string | null
          id?: string
          options?: Json
          reading_len?: number | null
          text?: string
        }
        Relationships: []
      }
      question_bank_concepts: {
        Row: {
          concept_id: string
          created_at: string
          id: string
          question_id: string
        }
        Insert: {
          concept_id: string
          created_at?: string
          id?: string
          question_id: string
        }
        Update: {
          concept_id?: string
          created_at?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_concepts_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_concepts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      train_ai_items: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          question_id: string
          session_id: string
          started_at: string
          timer_s: number | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          question_id: string
          session_id: string
          started_at?: string
          timer_s?: number | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          question_id?: string
          session_id?: string
          started_at?: string
          timer_s?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "train_ai_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "train_ai_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "train_ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      train_ai_sessions: {
        Row: {
          block: string
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          block: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          block?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_exam_enrollments: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exam_enrollments_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_justifications: {
        Row: {
          audio_url: string | null
          created_at: string
          effort_1_5: number | null
          error_cause: string | null
          id: string
          strategy_tags: string[] | null
          stress_1_5: number | null
          text: string | null
          train_ai_item_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          effort_1_5?: number | null
          error_cause?: string | null
          id?: string
          strategy_tags?: string[] | null
          stress_1_5?: number | null
          text?: string | null
          train_ai_item_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          effort_1_5?: number | null
          error_cause?: string | null
          id?: string
          strategy_tags?: string[] | null
          stress_1_5?: number | null
          text?: string | null
          train_ai_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_justifications_train_ai_item_id_fkey"
            columns: ["train_ai_item_id"]
            isOneToOne: false
            referencedRelation: "train_ai_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
