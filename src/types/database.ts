export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      visa_documents: {
        Row: {
          created_at: string
          document_id: string
          id: string
          is_mandatory: boolean
          notes: string | null
          visa_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          is_mandatory?: boolean
          notes?: string | null
          visa_id: string
        }
        Update: {
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
          processing_time_fix: number | null
          processing_time_max: number | null
          processing_time_min: number | null
          processing_time_type: string
          relationship_requirement: string | null
          sponsor_other_details: string | null
          stay_duration: number | null
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
          processing_time_fix?: number | null
          processing_time_max?: number | null
          processing_time_min?: number | null
          processing_time_type?: string
          relationship_requirement?: string | null
          sponsor_other_details?: string | null
          stay_duration?: number | null
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
          processing_time_fix?: number | null
          processing_time_max?: number | null
          processing_time_min?: number | null
          processing_time_type?: string
          relationship_requirement?: string | null
          sponsor_other_details?: string | null
          stay_duration?: number | null
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
