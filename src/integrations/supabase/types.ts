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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          date: string
          group_id: string | null
          id: string
          note: string | null
          status: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          group_id?: string | null
          id?: string
          note?: string | null
          status?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          date?: string
          group_id?: string | null
          id?: string
          note?: string | null
          status?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity: string | null
          id: string
          teacher_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity?: string | null
          id?: string
          teacher_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity?: string | null
          id?: string
          teacher_id?: string
        }
        Relationships: []
      }
      backups: {
        Row: {
          created_at: string
          data: Json
          id: string
          size_kb: number
          teacher_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          size_kb?: number
          teacher_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          size_kb?: number
          teacher_id?: string
        }
        Relationships: []
      }
      exam_answers: {
        Row: {
          answer: string | null
          id: string
          is_correct: boolean | null
          question_id: string
          score: number
          submission_id: string
          teacher_id: string
        }
        Insert: {
          answer?: string | null
          id?: string
          is_correct?: boolean | null
          question_id: string
          score?: number
          submission_id: string
          teacher_id: string
        }
        Update: {
          answer?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
          score?: number
          submission_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "exam_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_answer: string | null
          exam_id: string
          id: string
          options: Json
          order_index: number
          question: string
          score: number
          teacher_id: string
          type: string
        }
        Insert: {
          correct_answer?: string | null
          exam_id: string
          id?: string
          options?: Json
          order_index?: number
          question: string
          score?: number
          teacher_id: string
          type?: string
        }
        Update: {
          correct_answer?: string | null
          exam_id?: string
          id?: string
          options?: Json
          order_index?: number
          question?: string
          score?: number
          teacher_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_submissions: {
        Row: {
          exam_id: string
          id: string
          percentage: number
          score: number
          started_at: string
          status: string
          student_id: string
          submitted_at: string | null
          teacher_id: string
        }
        Insert: {
          exam_id: string
          id?: string
          percentage?: number
          score?: number
          started_at?: string
          status?: string
          student_id: string
          submitted_at?: string | null
          teacher_id: string
        }
        Update: {
          exam_id?: string
          id?: string
          percentage?: number
          score?: number
          started_at?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_submissions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          allow_retake: boolean
          created_at: string
          duration_minutes: number
          exam_date: string | null
          grade: string | null
          group_id: string | null
          id: string
          results_published: boolean
          source: string
          status: string
          subject: string | null
          teacher_id: string
          title: string
          total_score: number
        }
        Insert: {
          allow_retake?: boolean
          created_at?: string
          duration_minutes?: number
          exam_date?: string | null
          grade?: string | null
          group_id?: string | null
          id?: string
          results_published?: boolean
          source?: string
          status?: string
          subject?: string | null
          teacher_id: string
          title: string
          total_score?: number
        }
        Update: {
          allow_retake?: boolean
          created_at?: string
          duration_minutes?: number
          exam_date?: string | null
          grade?: string | null
          group_id?: string | null
          id?: string
          results_published?: boolean
          source?: string
          status?: string
          subject?: string | null
          teacher_id?: string
          title?: string
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "exams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          class_time: string | null
          created_at: string
          days: string[]
          fee: number
          grade: string | null
          id: string
          name: string
          payment_day: string | null
          room: string | null
          subject: string | null
          teacher_id: string
        }
        Insert: {
          class_time?: string | null
          created_at?: string
          days?: string[]
          fee?: number
          grade?: string | null
          id?: string
          name: string
          payment_day?: string | null
          room?: string | null
          subject?: string | null
          teacher_id: string
        }
        Update: {
          class_time?: string | null
          created_at?: string
          days?: string[]
          fee?: number
          grade?: string | null
          id?: string
          name?: string
          payment_day?: string | null
          room?: string | null
          subject?: string | null
          teacher_id?: string
        }
        Relationships: []
      }
      homework: {
        Row: {
          attachment_url: string | null
          created_at: string
          description: string | null
          due_date: string | null
          group_id: string | null
          id: string
          published: boolean
          teacher_id: string
          title: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          published?: boolean
          teacher_id: string
          title: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          published?: boolean
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_questions: {
        Row: {
          homework_id: string
          id: string
          order_index: number
          question: string
          teacher_id: string
        }
        Insert: {
          homework_id: string
          id?: string
          order_index?: number
          question: string
          teacher_id: string
        }
        Update: {
          homework_id?: string
          id?: string
          order_index?: number
          question?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_questions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          answers: Json
          feedback: string | null
          grade: number | null
          homework_id: string
          id: string
          status: string
          student_id: string
          submitted_at: string
          teacher_id: string
        }
        Insert: {
          answers?: Json
          feedback?: string | null
          grade?: number | null
          homework_id: string
          id?: string
          status?: string
          student_id: string
          submitted_at?: string
          teacher_id: string
        }
        Update: {
          answers?: Json
          feedback?: string | null
          grade?: number | null
          homework_id?: string
          id?: string
          status?: string
          student_id?: string
          submitted_at?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          activated_at: string | null
          created_at: string
          email: string | null
          id: string
          license_key: string
          license_type: string
          notes: string | null
          status: Database["public"]["Enums"]["license_status"]
          teacher_id: string | null
          teacher_name: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_key: string
          license_type?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          teacher_id?: string | null
          teacher_name?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_key?: string
          license_type?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          teacher_id?: string | null
          teacher_name?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          student_id: string | null
          teacher_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          student_id?: string | null
          teacher_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          student_id?: string | null
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          due_date: string | null
          group_id: string | null
          id: string
          note: string | null
          paid_at: string | null
          status: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          group_id?: string | null
          id?: string
          note?: string | null
          paid_at?: string | null
          status?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          group_id?: string | null
          id?: string
          note?: string | null
          paid_at?: string | null
          status?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          day: string
          end_time: string | null
          group_id: string | null
          id: string
          room: string | null
          start_time: string | null
          teacher_id: string
        }
        Insert: {
          created_at?: string
          day: string
          end_time?: string | null
          group_id?: string | null
          id?: string
          room?: string | null
          start_time?: string | null
          teacher_id: string
        }
        Update: {
          created_at?: string
          day?: string
          end_time?: string | null
          group_id?: string | null
          id?: string
          room?: string | null
          start_time?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          data: Json
          teacher_id: string
          updated_at: string
        }
        Insert: {
          data?: Json
          teacher_id: string
          updated_at?: string
        }
        Update: {
          data?: Json
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          created_at: string
          id: string
          question: string
          status: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          question: string
          status?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          question?: string
          status?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_questions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          deleted_at: string | null
          full_name: string
          gender: string | null
          grade: string | null
          group_id: string | null
          guardian_phone: string | null
          id: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          school: string | null
          section: string | null
          status: string
          student_code: string | null
          subject: string | null
          teacher_id: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name: string
          gender?: string | null
          grade?: string | null
          group_id?: string | null
          guardian_phone?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          school?: string | null
          section?: string | null
          status?: string
          student_code?: string | null
          subject?: string | null
          teacher_id: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string
          gender?: string | null
          grade?: string | null
          group_id?: string | null
          guardian_phone?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          school?: string | null
          section?: string | null
          status?: string
          student_code?: string | null
          subject?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          center_name: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_suspended: boolean
          license_status: Database["public"]["Enums"]["license_status"]
          logo_url: string | null
          phone: string | null
        }
        Insert: {
          center_name?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_suspended?: boolean
          license_status?: Database["public"]["Enums"]["license_status"]
          logo_url?: string | null
          phone?: string | null
        }
        Update: {
          center_name?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_suspended?: boolean
          license_status?: Database["public"]["Enums"]["license_status"]
          logo_url?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      trial_sessions: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          started_at: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string
          id?: string
          started_at?: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          started_at?: string
          teacher_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "teacher"
      license_status: "pending" | "trial" | "active" | "suspended" | "revoked"
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
    Enums: {
      app_role: ["super_admin", "teacher"],
      license_status: ["pending", "trial", "active", "suspended", "revoked"],
    },
  },
} as const
