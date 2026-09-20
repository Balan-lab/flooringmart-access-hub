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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_change_log: {
        Row: {
          action: Database["public"]["Enums"]["change_action"]
          approved_by: string | null
          change_date: string
          completed_by: string | null
          created_at: string
          created_by: string | null
          employee_id: string | null
          id: string
          new_access: string | null
          notes: string | null
          old_access: string | null
          reason: string | null
          system_id: string | null
          ticket_reference: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["change_action"]
          approved_by?: string | null
          change_date?: string
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          new_access?: string | null
          notes?: string | null
          old_access?: string | null
          reason?: string | null
          system_id?: string | null
          ticket_reference?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["change_action"]
          approved_by?: string | null
          change_date?: string
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          new_access?: string | null
          notes?: string | null
          old_access?: string | null
          reason?: string | null
          system_id?: string | null
          ticket_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_change_log_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_change_log_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      access_records: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          access_owner: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          granted_by: string | null
          granted_on: string | null
          id: string
          last_review_date: string | null
          mfa_enabled: boolean
          notes: string | null
          removed_by: string | null
          removed_on: string | null
          status: Database["public"]["Enums"]["access_status"]
          system_id: string
          updated_at: string
          updated_by: string | null
          username: string | null
          vault_reference: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          access_owner?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          granted_by?: string | null
          granted_on?: string | null
          id?: string
          last_review_date?: string | null
          mfa_enabled?: boolean
          notes?: string | null
          removed_by?: string | null
          removed_on?: string | null
          status?: Database["public"]["Enums"]["access_status"]
          system_id: string
          updated_at?: string
          updated_by?: string | null
          username?: string | null
          vault_reference?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          access_owner?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          granted_by?: string | null
          granted_on?: string | null
          id?: string
          last_review_date?: string | null
          mfa_enabled?: boolean
          notes?: string | null
          removed_by?: string | null
          removed_on?: string | null
          status?: Database["public"]["Enums"]["access_status"]
          system_id?: string
          updated_at?: string
          updated_by?: string | null
          username?: string | null
          vault_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_records_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          email: string | null
          employee_code: string
          end_date: string | null
          full_name: string
          id: string
          job_title: string | null
          manager_id: string | null
          notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          employee_code: string
          end_date?: string | null
          full_name: string
          id?: string
          job_title?: string | null
          manager_id?: string | null
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          employee_code?: string
          end_date?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          manager_id?: string | null
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      review_items: {
        Row: {
          access_record_id: string | null
          completed: boolean
          created_at: string
          decision: Database["public"]["Enums"]["review_decision"] | null
          id: string
          label: string | null
          notes: string | null
          review_id: string
          reviewed_by: string | null
          reviewed_on: string | null
          system_id: string | null
          updated_at: string
        }
        Insert: {
          access_record_id?: string | null
          completed?: boolean
          created_at?: string
          decision?: Database["public"]["Enums"]["review_decision"] | null
          id?: string
          label?: string | null
          notes?: string | null
          review_id: string
          reviewed_by?: string | null
          reviewed_on?: string | null
          system_id?: string | null
          updated_at?: string
        }
        Update: {
          access_record_id?: string | null
          completed?: boolean
          created_at?: string
          decision?: Database["public"]["Enums"]["review_decision"] | null
          id?: string
          label?: string | null
          notes?: string | null
          review_id?: string
          reviewed_by?: string | null
          reviewed_on?: string | null
          system_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_items_access_record_id_fkey"
            columns: ["access_record_id"]
            isOneToOne: false
            referencedRelation: "access_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_items_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_items_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          notes: string | null
          period: string
          status: Database["public"]["Enums"]["workflow_status"]
          title: string
          type: Database["public"]["Enums"]["review_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          period: string
          status?: Database["public"]["Enums"]["workflow_status"]
          title: string
          type: Database["public"]["Enums"]["review_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          period?: string
          status?: Database["public"]["Enums"]["workflow_status"]
          title?: string
          type?: Database["public"]["Enums"]["review_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      role_access_templates: {
        Row: {
          created_at: string
          id: string
          job_title: string
          notes: string | null
          recommended_level: Database["public"]["Enums"]["access_level"]
          system_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_title: string
          notes?: string | null
          recommended_level?: Database["public"]["Enums"]["access_level"]
          system_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_title?: string
          notes?: string | null
          recommended_level?: Database["public"]["Enums"]["access_level"]
          system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_access_templates_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      systems: {
        Row: {
          account_email: string | null
          active_users: number | null
          annual_cost: number | null
          business_owner: string | null
          cancellation_date: string | null
          category: string | null
          consolidation_candidate: boolean
          created_at: string
          created_by: string | null
          decision: Database["public"]["Enums"]["review_decision"]
          id: string
          monthly_cost: number | null
          name: string
          notes: string | null
          paid_seats: number | null
          purpose: string | null
          renewal_date: string | null
          status: Database["public"]["Enums"]["system_status"]
          technical_owner: string | null
          updated_at: string
          updated_by: string | null
          vendor: string | null
        }
        Insert: {
          account_email?: string | null
          active_users?: number | null
          annual_cost?: number | null
          business_owner?: string | null
          cancellation_date?: string | null
          category?: string | null
          consolidation_candidate?: boolean
          created_at?: string
          created_by?: string | null
          decision?: Database["public"]["Enums"]["review_decision"]
          id?: string
          monthly_cost?: number | null
          name: string
          notes?: string | null
          paid_seats?: number | null
          purpose?: string | null
          renewal_date?: string | null
          status?: Database["public"]["Enums"]["system_status"]
          technical_owner?: string | null
          updated_at?: string
          updated_by?: string | null
          vendor?: string | null
        }
        Update: {
          account_email?: string | null
          active_users?: number | null
          annual_cost?: number | null
          business_owner?: string | null
          cancellation_date?: string | null
          category?: string | null
          consolidation_candidate?: boolean
          created_at?: string
          created_by?: string | null
          decision?: Database["public"]["Enums"]["review_decision"]
          id?: string
          monthly_cost?: number | null
          name?: string
          notes?: string | null
          paid_seats?: number | null
          purpose?: string | null
          renewal_date?: string | null
          status?: Database["public"]["Enums"]["system_status"]
          technical_owner?: string | null
          updated_at?: string
          updated_by?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_items: {
        Row: {
          category: string | null
          completed: boolean
          completed_by: string | null
          completed_on: string | null
          created_at: string
          id: string
          label: string
          notes: string | null
          recommended_level: Database["public"]["Enums"]["access_level"] | null
          sort_order: number
          system_id: string | null
          updated_at: string
          verified: boolean
          verified_by: string | null
          workflow_id: string
        }
        Insert: {
          category?: string | null
          completed?: boolean
          completed_by?: string | null
          completed_on?: string | null
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          recommended_level?: Database["public"]["Enums"]["access_level"] | null
          sort_order?: number
          system_id?: string | null
          updated_at?: string
          verified?: boolean
          verified_by?: string | null
          workflow_id: string
        }
        Update: {
          category?: string | null
          completed?: boolean
          completed_by?: string | null
          completed_on?: string | null
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          recommended_level?: Database["public"]["Enums"]["access_level"] | null
          sort_order?: number
          system_id?: string | null
          updated_at?: string
          verified?: boolean
          verified_by?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_items_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_items_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          completed_on: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          notes: string | null
          started_on: string | null
          status: Database["public"]["Enums"]["workflow_status"]
          target_date: string | null
          title: string
          type: Database["public"]["Enums"]["workflow_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          completed_on?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          target_date?: string | null
          title: string
          type: Database["public"]["Enums"]["workflow_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          completed_on?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          target_date?: string | null
          title?: string
          type?: Database["public"]["Enums"]["workflow_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      access_level:
        | "Viewer"
        | "Read Only"
        | "Standard"
        | "Manager"
        | "Admin"
        | "Owner"
      access_status: "active" | "suspended" | "removed"
      app_role: "super_admin" | "it_admin" | "manager" | "viewer"
      change_action: "GRANT" | "MODIFY" | "ELEVATE" | "SUSPEND" | "REMOVE"
      employee_status: "active" | "on_leave" | "former"
      review_decision:
        | "KEEP"
        | "KEEP_IF_USED"
        | "VERIFY"
        | "CONSOLIDATE"
        | "CANCEL_AFTER_CONFIRMATION"
      review_type: "subscription" | "access"
      system_status:
        | "active"
        | "needs_review"
        | "pending_cancellation"
        | "cancelled"
      workflow_status: "not_started" | "in_progress" | "completed"
      workflow_type: "onboarding" | "offboarding" | "role_change"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      access_level: [
        "Viewer",
        "Read Only",
        "Standard",
        "Manager",
        "Admin",
        "Owner",
      ],
      access_status: ["active", "suspended", "removed"],
      app_role: ["super_admin", "it_admin", "manager", "viewer"],
      change_action: ["GRANT", "MODIFY", "ELEVATE", "SUSPEND", "REMOVE"],
      employee_status: ["active", "on_leave", "former"],
      review_decision: [
        "KEEP",
        "KEEP_IF_USED",
        "VERIFY",
        "CONSOLIDATE",
        "CANCEL_AFTER_CONFIRMATION",
      ],
      review_type: ["subscription", "access"],
      system_status: [
        "active",
        "needs_review",
        "pending_cancellation",
        "cancelled",
      ],
      workflow_status: ["not_started", "in_progress", "completed"],
      workflow_type: ["onboarding", "offboarding", "role_change"],
    },
  },
} as const
