export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string
          company_id: string | null
          actor_id: string | null
          actor_name: string | null
          entity: string | null
          action: string | null
          team: string | null
          created_at: string
          user_id: string | null
          user_name: string | null
          module: string | null
          event_type: string | null
          session_id: string | null
        }
        Insert: {
          id?: string
          company_id?: string | null
          actor_id?: string | null
          actor_name?: string | null
          entity?: string | null
          action?: string | null
          team?: string | null
          created_at?: string
          user_id?: string | null
          user_name?: string | null
          module?: string | null
          event_type?: string | null
          session_id?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          actor_id?: string | null
          actor_name?: string | null
          entity?: string | null
          action?: string | null
          team?: string | null
          created_at?: string
          user_id?: string | null
          user_name?: string | null
          module?: string | null
          event_type?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          company_id: string | null
          full_name: string | null
          email: string | null
          avatar_url: string | null
          status: string | null
          requested_role: string | null
          rejection_reason: string | null
          email_signature: string | null
          phone: string | null
          biometric_id: string | null
          monthly_salary: number | null
          punch_deadline: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Insert: {
          id: string
          company_id?: string | null
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          status?: string | null
          requested_role?: string | null
          rejection_reason?: string | null
          email_signature?: string | null
          phone?: string | null
          biometric_id?: string | null
          monthly_salary?: number | null
          punch_deadline?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          status?: string | null
          requested_role?: string | null
          rejection_reason?: string | null
          email_signature?: string | null
          phone?: string | null
          biometric_id?: string | null
          monthly_salary?: number | null
          punch_deadline?: string | null
        }
        Relationships: []
      }
      attendance_logs: {
        Row: {
          id: string
          employee_id: string
          company_id: string
          date: string
          status: string
          clock_in: string | null
          clock_out: string | null
          notes: string | null
          is_manual: boolean
          is_excused: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          company_id: string
          date?: string
          status?: string
          clock_in?: string | null
          clock_out?: string | null
          notes?: string | null
          is_manual?: boolean
          is_excused?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          company_id?: string
          date?: string
          status?: string
          clock_in?: string | null
          clock_out?: string | null
          notes?: string | null
          is_manual?: boolean
          is_excused?: boolean
          created_at?: string
          updated_at?: string
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