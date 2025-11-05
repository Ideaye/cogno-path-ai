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
      ai_items_quarantine: {
        Row: {
          created_at: string | null
          created_by: string | null
          difficulty_seed_0_1: number | null
          exam_id: string
          generator_version: string | null
          id: string
          issues: string[] | null
          originality_hash: string
          payload_json: Json
          quality_score: number | null
          reading_len: number | null
          required_strategy: string | null
          section: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          difficulty_seed_0_1?: number | null
          exam_id: string
          generator_version?: string | null
          id?: string
          issues?: string[] | null
          originality_hash: string
          payload_json: Json
          quality_score?: number | null
          reading_len?: number | null
          required_strategy?: string | null
          section: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          difficulty_seed_0_1?: number | null
          exam_id?: string
          generator_version?: string | null
          id?: string
          issues?: string[] | null
          originality_hash?: string
          payload_json?: Json
          quality_score?: number | null
          reading_len?: number | null
          required_strategy?: string | null
          section?: string
          status?: string | null
        }
        Relationships: []
      }
      aif_validation_queue: {
        Row: {
          aiq_id: string
          created_at: string | null
          error: string | null
          id: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          aiq_id: string
          created_at?: string | null
          error?: string | null
          id?: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          aiq_id?: string
          created_at?: string | null
          error?: string | null
          id?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aif_validation_queue_aiq_id_fkey"
            columns: ["aiq_id"]
            isOneToOne: false
            referencedRelation: "ai_items_quarantine"
            referencedColumns: ["id"]
          },
        ]
      }
      anchor_items: {
        Row: {
          active: boolean
          created_at: string
          exam_id: string
          id: string
          question_id: string
          section: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          exam_id: string
          id?: string
          question_id: string
          section: string
        }
        Update: {
          active?: boolean
          created_at?: string
          exam_id?: string
          id?: string
          question_id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "anchor_items_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anchor_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          assumptions: string | null
          attempt_number: number | null
          calibration_item_id: string | null
          checks: string | null
          confidence: number | null
          confidence_0_1: number | null
          correct: boolean
          created_at: string
          difficulty: number | null
          final_answer: string | null
          hesitation_count: number | null
          id: string
          is_synthetic: boolean | null
          justification_id: string | null
          latency_ms: number | null
          mode: string | null
          option_switches: number | null
          practice_item_id: string | null
          pressure_mode: string | null
          question_id: string
          resources: Json | null
          revisited: boolean | null
          strategy_tags: string[] | null
          time_taken: number
          time_taken_ms: number | null
          ui_variant: string | null
          user_id: string
        }
        Insert: {
          assumptions?: string | null
          attempt_number?: number | null
          calibration_item_id?: string | null
          checks?: string | null
          confidence?: number | null
          confidence_0_1?: number | null
          correct: boolean
          created_at?: string
          difficulty?: number | null
          final_answer?: string | null
          hesitation_count?: number | null
          id?: string
          is_synthetic?: boolean | null
          justification_id?: string | null
          latency_ms?: number | null
          mode?: string | null
          option_switches?: number | null
          practice_item_id?: string | null
          pressure_mode?: string | null
          question_id: string
          resources?: Json | null
          revisited?: boolean | null
          strategy_tags?: string[] | null
          time_taken: number
          time_taken_ms?: number | null
          ui_variant?: string | null
          user_id: string
        }
        Update: {
          assumptions?: string | null
          attempt_number?: number | null
          calibration_item_id?: string | null
          checks?: string | null
          confidence?: number | null
          confidence_0_1?: number | null
          correct?: boolean
          created_at?: string
          difficulty?: number | null
          final_answer?: string | null
          hesitation_count?: number | null
          id?: string
          is_synthetic?: boolean | null
          justification_id?: string | null
          latency_ms?: number | null
          mode?: string | null
          option_switches?: number | null
          practice_item_id?: string | null
          pressure_mode?: string | null
          question_id?: string
          resources?: Json | null
          revisited?: boolean | null
          strategy_tags?: string[] | null
          time_taken?: number
          time_taken_ms?: number | null
          ui_variant?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_calibration_item_id_fkey"
            columns: ["calibration_item_id"]
            isOneToOne: false
            referencedRelation: "calibration_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_justification_id_fkey"
            columns: ["justification_id"]
            isOneToOne: false
            referencedRelation: "user_justifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_practice_item_id_fkey"
            columns: ["practice_item_id"]
            isOneToOne: false
            referencedRelation: "practice_items"
            referencedColumns: ["id"]
          },
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
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      calibration_items: {
        Row: {
          choices: Json | null
          correct_key: string | null
          created_at: string | null
          difficulty_0_1: number | null
          exam_id: string
          id: string
          is_synthetic: boolean | null
          prompt: string
          stem: string | null
          strategy_tags: string[] | null
          topic: string | null
          unit: string | null
        }
        Insert: {
          choices?: Json | null
          correct_key?: string | null
          created_at?: string | null
          difficulty_0_1?: number | null
          exam_id: string
          id?: string
          is_synthetic?: boolean | null
          prompt: string
          stem?: string | null
          strategy_tags?: string[] | null
          topic?: string | null
          unit?: string | null
        }
        Update: {
          choices?: Json | null
          correct_key?: string | null
          created_at?: string | null
          difficulty_0_1?: number | null
          exam_id?: string
          id?: string
          is_synthetic?: boolean | null
          prompt?: string
          stem?: string | null
          strategy_tags?: string[] | null
          topic?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calibration_items_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      calibration_reports: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          report_type: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          report_type: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          report_type?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      calibration_sessions: {
        Row: {
          block: string
          created_at: string
          current_item_id: string | null
          exam_id: string
          id: string
          session_data: Json | null
          timer_remaining_s: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block: string
          created_at?: string
          current_item_id?: string | null
          exam_id: string
          id?: string
          session_data?: Json | null
          timer_remaining_s?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block?: string
          created_at?: string
          current_item_id?: string | null
          exam_id?: string
          id?: string
          session_data?: Json | null
          timer_remaining_s?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calibration_sessions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      cdna_versions: {
        Row: {
          created_at: string
          exam_id: string | null
          id: string
          source: string
          user_id: string
          vector_json: Json
          version: string
        }
        Insert: {
          created_at?: string
          exam_id?: string | null
          id?: string
          source: string
          user_id: string
          vector_json?: Json
          version: string
        }
        Update: {
          created_at?: string
          exam_id?: string | null
          id?: string
          source?: string
          user_id?: string
          vector_json?: Json
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "cdna_versions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
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
      eval_adjudications: {
        Row: {
          agreement_kappa: number | null
          created_at: string
          id: string
          is_synthetic: boolean | null
          jqs_0_1: number
          justification_id: string
          labels_json: Json
          rubric_version: string
        }
        Insert: {
          agreement_kappa?: number | null
          created_at?: string
          id?: string
          is_synthetic?: boolean | null
          jqs_0_1: number
          justification_id: string
          labels_json?: Json
          rubric_version?: string
        }
        Update: {
          agreement_kappa?: number | null
          created_at?: string
          id?: string
          is_synthetic?: boolean | null
          jqs_0_1?: number
          justification_id?: string
          labels_json?: Json
          rubric_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_adjudications_justification_id_fkey"
            columns: ["justification_id"]
            isOneToOne: true
            referencedRelation: "user_justifications"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_ratings: {
        Row: {
          confidence_0_1: number | null
          created_at: string
          id: string
          justification_id: string
          labels_json: Json
          template_id: string
        }
        Insert: {
          confidence_0_1?: number | null
          created_at?: string
          id?: string
          justification_id: string
          labels_json?: Json
          template_id: string
        }
        Update: {
          confidence_0_1?: number | null
          created_at?: string
          id?: string
          justification_id?: string
          labels_json?: Json
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_ratings_justification_id_fkey"
            columns: ["justification_id"]
            isOneToOne: false
            referencedRelation: "user_justifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_ratings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
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
          is_admin_only: boolean
          level: string | null
          name: string
          negative_marking_json: Json | null
        }
        Insert: {
          alias?: string[] | null
          created_at?: string
          duration_min?: number | null
          id?: string
          is_admin_only?: boolean
          level?: string | null
          name: string
          negative_marking_json?: Json | null
        }
        Update: {
          alias?: string[] | null
          created_at?: string
          duration_min?: number | null
          id?: string
          is_admin_only?: boolean
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
          anchor_score_mean: number | null
          anchor_score_std: number | null
          calibration_progress_0_1: number | null
          cdna_embed: number[] | null
          created_at: string
          ece_0_1: number | null
          exam_id: string
          fatigue_index: number | null
          id: string
          is_synthetic: boolean | null
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
          anchor_score_mean?: number | null
          anchor_score_std?: number | null
          calibration_progress_0_1?: number | null
          cdna_embed?: number[] | null
          created_at?: string
          ece_0_1?: number | null
          exam_id: string
          fatigue_index?: number | null
          id?: string
          is_synthetic?: boolean | null
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
          anchor_score_mean?: number | null
          anchor_score_std?: number | null
          calibration_progress_0_1?: number | null
          cdna_embed?: number[] | null
          created_at?: string
          ece_0_1?: number | null
          exam_id?: string
          fatigue_index?: number | null
          id?: string
          is_synthetic?: boolean | null
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
            isOneToOne: true
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
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
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
      practice_items: {
        Row: {
          choices: Json | null
          correct_answer: string | null
          created_at: string | null
          difficulty: number | null
          difficulty_0_1: number | null
          exam_id: string
          id: string
          is_synthetic: boolean | null
          stem: string
          strategy_tags: string[] | null
          tags: string[] | null
          topic: string | null
          unit: string | null
        }
        Insert: {
          choices?: Json | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: number | null
          difficulty_0_1?: number | null
          exam_id: string
          id?: string
          is_synthetic?: boolean | null
          stem: string
          strategy_tags?: string[] | null
          tags?: string[] | null
          topic?: string | null
          unit?: string | null
        }
        Update: {
          choices?: Json | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: number | null
          difficulty_0_1?: number | null
          exam_id?: string
          id?: string
          is_synthetic?: boolean | null
          stem?: string
          strategy_tags?: string[] | null
          tags?: string[] | null
          topic?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_items_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
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
          is_admin: boolean | null
          is_synthetic: boolean | null
          name: string
        }
        Insert: {
          cognitive_profile?: Json | null
          created_at?: string
          email: string
          exam_type: string
          id: string
          is_admin?: boolean | null
          is_synthetic?: boolean | null
          name: string
        }
        Update: {
          cognitive_profile?: Json | null
          created_at?: string
          email?: string
          exam_type?: string
          id?: string
          is_admin?: boolean | null
          is_synthetic?: boolean | null
          name?: string
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          created_at: string
          id: string
          role: string
          text: string
          version: string
        }
        Insert: {
          created_at?: string
          id: string
          role: string
          text: string
          version?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          text?: string
          version?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          concept_tag: string
          correct_option: string
          created_at: string
          difficulty: number | null
          flags_json: Json | null
          format_type: string | null
          generator_version: string | null
          id: string
          options: Json
          originality_hash: string | null
          quality_score: number | null
          reading_len: number | null
          required_strategy: string | null
          source: string | null
          text: string
        }
        Insert: {
          concept_tag: string
          correct_option: string
          created_at?: string
          difficulty?: number | null
          flags_json?: Json | null
          format_type?: string | null
          generator_version?: string | null
          id?: string
          options: Json
          originality_hash?: string | null
          quality_score?: number | null
          reading_len?: number | null
          required_strategy?: string | null
          source?: string | null
          text: string
        }
        Update: {
          concept_tag?: string
          correct_option?: string
          created_at?: string
          difficulty?: number | null
          flags_json?: Json | null
          format_type?: string | null
          generator_version?: string | null
          id?: string
          options?: Json
          originality_hash?: string | null
          quality_score?: number | null
          reading_len?: number | null
          required_strategy?: string | null
          source?: string | null
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
      question_difficulty_history: {
        Row: {
          created_at: string | null
          id: number
          new: number
          old: number
          question_id: string
          reason: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          new: number
          old: number
          question_id: string
          reason: string
        }
        Update: {
          created_at?: string | null
          id?: number
          new?: number
          old?: number
          question_id?: string
          reason?: string
        }
        Relationships: []
      }
      strategy_tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
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
          answer: string | null
          assumptions: string[] | null
          assumptions_text: string | null
          audio_url: string | null
          checks_units: string | null
          confidence_0_1: number | null
          created_at: string
          effort_1_5: number | null
          error_cause: string | null
          exam_id: string | null
          id: string
          is_synthetic: boolean | null
          justification: string | null
          perceived_difficulty: number | null
          perceived_difficulty_1_5: number | null
          resources_used: Json | null
          strategy_tags: string[] | null
          stress_1_5: number | null
          text: string | null
          train_ai_item_id: string
          user_id: string | null
        }
        Insert: {
          answer?: string | null
          assumptions?: string[] | null
          assumptions_text?: string | null
          audio_url?: string | null
          checks_units?: string | null
          confidence_0_1?: number | null
          created_at?: string
          effort_1_5?: number | null
          error_cause?: string | null
          exam_id?: string | null
          id?: string
          is_synthetic?: boolean | null
          justification?: string | null
          perceived_difficulty?: number | null
          perceived_difficulty_1_5?: number | null
          resources_used?: Json | null
          strategy_tags?: string[] | null
          stress_1_5?: number | null
          text?: string | null
          train_ai_item_id: string
          user_id?: string | null
        }
        Update: {
          answer?: string | null
          assumptions?: string[] | null
          assumptions_text?: string | null
          audio_url?: string | null
          checks_units?: string | null
          confidence_0_1?: number | null
          created_at?: string
          effort_1_5?: number | null
          error_cause?: string | null
          exam_id?: string | null
          id?: string
          is_synthetic?: boolean | null
          justification?: string | null
          perceived_difficulty?: number | null
          perceived_difficulty_1_5?: number | null
          resources_used?: Json | null
          strategy_tags?: string[] | null
          stress_1_5?: number | null
          text?: string | null
          train_ai_item_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_justifications_train_ai_item_id_fkey"
            columns: ["train_ai_item_id"]
            isOneToOne: true
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
      bump_calibration_progress: {
        Args: { justification_id: string }
        Returns: undefined
      }
      compute_item_hash: {
        Args: { correct: string; options: string[]; stem: string }
        Returns: string
      }
      create_calibration_attempt: {
        Args: {
          p_assumptions: string
          p_checks: string
          p_confidence_0_1: number
          p_difficulty: number
          p_exam_id: string
          p_final_answer: string
          p_is_correct: boolean
          p_justification: string
          p_latency_ms: number
          p_resources: Json
          p_strategy_tags: string[]
          p_train_ai_item_id: string
        }
        Returns: {
          attempt_id: string
          justification_id: string
        }[]
      }
      ensure_enrolled_and_set_active: {
        Args: { p_exam_id: string }
        Returns: undefined
      }
      get_last_jqs_for_user_exam: {
        Args: { p_exam: string; p_user: string }
        Returns: {
          created_at: string
          jqs_0_1: number
        }[]
      }
      get_recent_cron_runs: {
        Args: never
        Returns: {
          end_time: string
          jobname: string
          start_time: string
          status: string
        }[]
      }
      norm_text: { Args: { t: string }; Returns: string }
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
