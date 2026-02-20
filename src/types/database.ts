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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          code: string
          created_at: string
          description: string
          flag: string | null
          id: string
          name: string
          parent_id: string | null
          postal_code: string
          timezone: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string
          flag?: string | null
          id?: string
          name: string
          parent_id?: string | null
          postal_code?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          flag?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          postal_code?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_special_prices: {
        Row: {
          agent_id: string | null
          created_at: string | null
          id: string
          last_updated_at: string | null
          notes: string | null
          price: number
          visa_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          last_updated_at?: string | null
          notes?: string | null
          price: number
          visa_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          last_updated_at?: string | null
          notes?: string | null
          price?: number
          visa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_special_prices_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_special_prices_visa_id_fkey"
            columns: ["visa_id"]
            isOneToOne: false
            referencedRelation: "visas"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          allow_multiple: boolean
          created_at: string
          description: string | null
          formats: string[]
          id: string
          name: string
          sub_documents: string[]
          updated_at: string
        }
        Insert: {
          allow_multiple?: boolean
          created_at?: string
          description?: string | null
          formats?: string[]
          id?: string
          name: string
          sub_documents?: string[]
          updated_at?: string
        }
        Update: {
          allow_multiple?: boolean
          created_at?: string
          description?: string | null
          formats?: string[]
          id?: string
          name?: string
          sub_documents?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      purposes: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      visa_campaigns: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          rules: Json | null
          start_date: string | null
          visa_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rules?: Json | null
          start_date?: string | null
          visa_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rules?: Json | null
          start_date?: string | null
          visa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visa_campaigns_visa_id_fkey"
            columns: ["visa_id"]
            isOneToOne: false
            referencedRelation: "visas"
            referencedColumns: ["id"]
          },
        ]
      }
      visa_documents: {
        Row: {
          config: Json | null
          created_at: string
          document_id: string
          id: string
          is_mandatory: boolean
          notes: string | null
          visa_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          document_id: string
          id?: string
          is_mandatory?: boolean
          notes?: string | null
          visa_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          document_id?: string
          id?: string
          is_mandatory?: boolean
          notes?: string | null
          visa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_documents_visa_id_fkey"
            columns: ["visa_id"]
            isOneToOne: false
            referencedRelation: "visas"
            referencedColumns: ["id"]
          },
        ]
      }
      visas: {
        Row: {
          allowed_sponsors: string[]
          application_method: string
          appointed_cities_list: string[]
          appointed_city: string | null
          available_cities_list: string[]
          category: string | null
          country: string
          created_at: string
          currency: string
          earliest_apply_time: number | null
          history_requirement: string | null
          id: string
          is_applicant_presence_required: boolean
          is_need_appointment: boolean
          job_requirement: string | null
          location_type: string | null
          marriage_requirement: string | null
          max_age: number | null
          min_age: number | null
          name: string
          need_physical_passport: boolean
          price: number
          price_agent: number | null
          pricing_breakdown: Json | null
          pricing_rules: Json | null
          process_center_fix: number | null
          process_center_max: number | null
          process_center_min: number | null
          process_center_type: string | null
          process_internal_fix: number | null
          process_internal_max: number | null
          process_internal_min: number | null
          process_internal_type: string | null
          processing_time_fix: number | null
          processing_time_max: number | null
          processing_time_min: number | null
          processing_time_type: string
          purpose: string | null
          questions_data: Json | null
          relationship_requirement: string | null
          requirements_data: Json | null
          sponsor_other_details: string | null
          stay_duration: number | null
          stay_duration_fix: number | null
          stay_duration_max: number | null
          stay_duration_min: number | null
          stay_duration_type: string | null
          type: string
          updated_at: string
          validity_fix: number | null
          validity_max: number | null
          validity_min: number | null
          validity_type: string
        }
        Insert: {
          allowed_sponsors?: string[]
          application_method?: string
          appointed_cities_list?: string[]
          appointed_city?: string | null
          available_cities_list?: string[]
          category?: string | null
          country: string
          created_at?: string
          currency?: string
          earliest_apply_time?: number | null
          history_requirement?: string | null
          id?: string
          is_applicant_presence_required?: boolean
          is_need_appointment?: boolean
          job_requirement?: string | null
          location_type?: string | null
          marriage_requirement?: string | null
          max_age?: number | null
          min_age?: number | null
          name: string
          need_physical_passport?: boolean
          price?: number
          price_agent?: number | null
          pricing_breakdown?: Json | null
          pricing_rules?: Json | null
          process_center_fix?: number | null
          process_center_max?: number | null
          process_center_min?: number | null
          process_center_type?: string | null
          process_internal_fix?: number | null
          process_internal_max?: number | null
          process_internal_min?: number | null
          process_internal_type?: string | null
          processing_time_fix?: number | null
          processing_time_max?: number | null
          processing_time_min?: number | null
          processing_time_type?: string
          purpose?: string | null
          questions_data?: Json | null
          relationship_requirement?: string | null
          requirements_data?: Json | null
          sponsor_other_details?: string | null
          stay_duration?: number | null
          stay_duration_fix?: number | null
          stay_duration_max?: number | null
          stay_duration_min?: number | null
          stay_duration_type?: string | null
          type?: string
          updated_at?: string
          validity_fix?: number | null
          validity_max?: number | null
          validity_min?: number | null
          validity_type?: string
        }
        Update: {
          allowed_sponsors?: string[]
          application_method?: string
          appointed_cities_list?: string[]
          appointed_city?: string | null
          available_cities_list?: string[]
          category?: string | null
          country?: string
          created_at?: string
          currency?: string
          earliest_apply_time?: number | null
          history_requirement?: string | null
          id?: string
          is_applicant_presence_required?: boolean
          is_need_appointment?: boolean
          job_requirement?: string | null
          location_type?: string | null
          marriage_requirement?: string | null
          max_age?: number | null
          min_age?: number | null
          name?: string
          need_physical_passport?: boolean
          price?: number
          price_agent?: number | null
          pricing_breakdown?: Json | null
          pricing_rules?: Json | null
          process_center_fix?: number | null
          process_center_max?: number | null
          process_center_min?: number | null
          process_center_type?: string | null
          process_internal_fix?: number | null
          process_internal_max?: number | null
          process_internal_min?: number | null
          process_internal_type?: string | null
          processing_time_fix?: number | null
          processing_time_max?: number | null
          processing_time_min?: number | null
          processing_time_type?: string
          purpose?: string | null
          questions_data?: Json | null
          relationship_requirement?: string | null
          requirements_data?: Json | null
          sponsor_other_details?: string | null
          stay_duration?: number | null
          stay_duration_fix?: number | null
          stay_duration_max?: number | null
          stay_duration_min?: number | null
          stay_duration_type?: string | null
          type?: string
          updated_at?: string
          validity_fix?: number | null
          validity_max?: number | null
          validity_min?: number | null
          validity_type?: string
        }
        Relationships: []
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
