export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' }
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; phone: string | null; role: Database['public']['Enums']['user_role']; status: Database['public']['Enums']['account_status']; verification_status: Database['public']['Enums']['verification_status']; avatar_url: string | null; location: string | null; bio: string | null; onboarding_completed: boolean; created_at: string; updated_at: string }
        Insert: { id: string; full_name?: string | null; phone?: string | null; role?: Database['public']['Enums']['user_role']; status?: Database['public']['Enums']['account_status']; verification_status?: Database['public']['Enums']['verification_status']; avatar_url?: string | null; location?: string | null; bio?: string | null; onboarding_completed?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; full_name?: string | null; phone?: string | null; role?: Database['public']['Enums']['user_role']; status?: Database['public']['Enums']['account_status']; verification_status?: Database['public']['Enums']['verification_status']; avatar_url?: string | null; location?: string | null; bio?: string | null; onboarding_completed?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      skills: { Row: { id: string; name: string; category: string | null; created_at: string }; Insert: { id?: string; name: string; category?: string | null; created_at?: string }; Update: { id?: string; name?: string; category?: string | null; created_at?: string }; Relationships: [] }
      worker_profiles: { Row: { user_id: string; availability: string | null; hourly_rate: number | null; experience_years: number | null; created_at: string; updated_at: string }; Insert: { user_id: string; availability?: string | null; hourly_rate?: number | null; experience_years?: number | null; created_at?: string; updated_at?: string }; Update: { user_id?: string; availability?: string | null; hourly_rate?: number | null; experience_years?: number | null; created_at?: string; updated_at?: string }; Relationships: [] }
      worker_skills: { Row: { worker_id: string; skill_id: string; created_at: string }; Insert: { worker_id: string; skill_id: string; created_at?: string }; Update: { worker_id?: string; skill_id?: string; created_at?: string }; Relationships: [] }
      employer_profiles: { Row: { user_id: string; organisation_name: string | null; organisation_type: string | null; website: string | null; created_at: string; updated_at: string }; Insert: { user_id: string; organisation_name?: string | null; organisation_type?: string | null; website?: string | null; created_at?: string; updated_at?: string }; Update: { user_id?: string; organisation_name?: string | null; organisation_type?: string | null; website?: string | null; created_at?: string; updated_at?: string }; Relationships: [] }
      jobs: { Row: { id: string; employer_id: string; title: string; description: string; category: string | null; location: string | null; pay_amount: number; pay_currency: string; status: Database['public']['Enums']['job_status']; created_at: string; updated_at: string }; Insert: { id?: string; employer_id: string; title: string; description: string; category?: string | null; location?: string | null; pay_amount: number; pay_currency?: string; status?: Database['public']['Enums']['job_status']; created_at?: string; updated_at?: string }; Update: { id?: string; employer_id?: string; title?: string; description?: string; category?: string | null; location?: string | null; pay_amount?: number; pay_currency?: string; status?: Database['public']['Enums']['job_status']; created_at?: string; updated_at?: string }; Relationships: [] }
      job_skills: { Row: { job_id: string; skill_id: string; required: boolean }; Insert: { job_id: string; skill_id: string; required?: boolean }; Update: { job_id?: string; skill_id?: string; required?: boolean }; Relationships: [] }
      applications: { Row: { id: string; job_id: string; worker_id: string; status: Database['public']['Enums']['application_status']; cover_note: string | null; created_at: string; updated_at: string }; Insert: { id?: string; job_id: string; worker_id: string; status?: Database['public']['Enums']['application_status']; cover_note?: string | null; created_at?: string; updated_at?: string }; Update: { id?: string; job_id?: string; worker_id?: string; status?: Database['public']['Enums']['application_status']; cover_note?: string | null; created_at?: string; updated_at?: string }; Relationships: [] }
      employments: { Row: { id: string; job_id: string; application_id: string; employer_id: string; worker_id: string; status: string; started_at: string; completed_at: string | null; created_at: string; updated_at: string }; Insert: { id?: string; job_id: string; application_id: string; employer_id: string; worker_id: string; status?: string; started_at?: string; completed_at?: string | null; created_at?: string; updated_at?: string }; Update: { id?: string; job_id?: string; application_id?: string; employer_id?: string; worker_id?: string; status?: string; started_at?: string; completed_at?: string | null; created_at?: string; updated_at?: string }; Relationships: [] }
      matches: { Row: { id: string; job_id: string; worker_id: string; score: number | null; reason: string | null; created_at: string }; Insert: { id?: string; job_id: string; worker_id: string; score?: number | null; reason?: string | null; created_at?: string }; Update: { id?: string; job_id?: string; worker_id?: string; score?: number | null; reason?: string | null; created_at?: string }; Relationships: [] }
      transactions: { Row: { id: string; job_id: string | null; worker_id: string; employer_id: string; amount: number; currency: string; status: string; provider: string | null; provider_reference: string | null; created_at: string; updated_at: string }; Insert: { id?: string; job_id?: string | null; worker_id: string; employer_id: string; amount: number; currency?: string; status?: string; provider?: string | null; provider_reference?: string | null; created_at?: string; updated_at?: string }; Update: { id?: string; job_id?: string | null; worker_id?: string; employer_id?: string; amount?: number; currency?: string; status?: string; provider?: string | null; provider_reference?: string | null; created_at?: string; updated_at?: string }; Relationships: [] }
      reviews: { Row: { id: string; transaction_id: string; reviewer_id: string; reviewee_id: string; rating: number; comment: string | null; created_at: string }; Insert: { id?: string; transaction_id: string; reviewer_id: string; reviewee_id: string; rating: number; comment?: string | null; created_at?: string }; Update: { id?: string; transaction_id?: string; reviewer_id?: string; reviewee_id?: string; rating?: number; comment?: string | null; created_at?: string }; Relationships: [] }
      disputes: { Row: { id: string; transaction_id: string | null; opened_by: string; reason: string; description: string; status: string; resolution: string | null; created_at: string; updated_at: string }; Insert: { id?: string; transaction_id?: string | null; opened_by: string; reason: string; description: string; status?: string; resolution?: string | null; created_at?: string; updated_at?: string }; Update: { id?: string; transaction_id?: string | null; opened_by?: string; reason?: string; description?: string; status?: string; resolution?: string | null; created_at?: string; updated_at?: string }; Relationships: [] }
      audit_logs: { Row: { id: number; actor_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: Json; created_at: string }; Insert: { id?: never; actor_id?: string | null; action: string; entity_type: string; entity_id?: string | null; metadata?: Json; created_at?: string }; Update: { id?: never; actor_id?: string | null; action?: string; entity_type?: string; entity_id?: string | null; metadata?: Json; created_at?: string }; Relationships: [] }
    }
    Views: { [_ in never]: never }
    Functions: {
      apply_to_job: { Args: { new_cover_note?: string; target_job_id: string }; Returns: string }
      complete_my_onboarding: { Args: { new_full_name: string; new_location: string; new_organisation_name?: string; new_organisation_type?: string; new_phone?: string; new_role: string }; Returns: undefined }
      confirm_employment_payment: { Args: { target_employment_id: string }; Returns: string }
      create_my_job: { Args: { new_category?: string; new_description: string; new_location?: string; new_pay_amount?: number; new_title: string }; Returns: string }
      get_my_applications: { Args: never; Returns: { application_id: string; application_status: string; applied_at: string; cover_note: string; employer_name: string; job_category: string; job_id: string; job_location: string; job_status: string; job_title: string; pay_amount: number; pay_currency: string; updated_at: string }[] }
      get_my_candidate_recommendations: { Args: { limit_count?: number; target_job_id: string }; Returns: { availability: string; bio: string; experience_years: number; hourly_rate: number; location: string; reason: string; score: number; verification_status: string; worker_id: string; worker_name: string }[] }
      get_my_employments: { Args: never; Returns: { employer_id: string; employer_name: string; employment_id: string; job_id: string; job_title: string; started_at: string; status: string; worker_id: string; worker_name: string }[] }
      get_my_job_applicants: { Args: { target_job_id: string }; Returns: { application_id: string; applied_at: string; availability: string; cover_note: string; experience_years: number; hourly_rate: number; job_id: string; status: string; verification_status: string; worker_bio: string; worker_id: string; worker_location: string; worker_name: string; worker_phone: string }[] }
      get_my_profile: { Args: never; Returns: { bio: string; full_name: string; id: string; location: string; onboarding_completed: boolean; role: Database['public']['Enums']['user_role']; status: Database['public']['Enums']['account_status']; verification_status: Database['public']['Enums']['verification_status'] }[] }
      get_my_recommended_jobs: { Args: { limit_count?: number }; Returns: { category: string; description: string; employer_name: string; employer_verification: string; job_id: string; location: string; pay_amount: number; pay_currency: string; reason: string; score: number; title: string }[] }
      get_public_employer_profile: { Args: { target_user_id: string }; Returns: { avatar_url: string; bio: string; full_name: string; location: string; organisation_name: string; organisation_type: string; user_id: string; verification_status: Database['public']['Enums']['verification_status']; website: string }[] }
      get_public_worker_profile: { Args: { target_user_id: string }; Returns: { availability: string; avatar_url: string; bio: string; experience_years: number; full_name: string; hourly_rate: number; location: string; skills: string[]; user_id: string; verification_status: Database['public']['Enums']['verification_status'] }[] }
      hire_worker: { Args: { target_application_id: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      review_my_employment: { Args: { new_comment?: string; new_rating: number; target_employment_id: string }; Returns: string }
      set_my_role: { Args: { new_role: Database['public']['Enums']['user_role'] }; Returns: Database['public']['Enums']['user_role'] }
      transition_my_employment: { Args: { new_status: string; target_employment_id: string }; Returns: boolean }
      transition_my_job_status: { Args: { new_status: string; target_job_id: string }; Returns: Database['public']['Enums']['job_status'] }
      update_my_employer_profile: { Args: { new_bio: string; new_full_name: string; new_location: string; new_organisation_name: string; new_organisation_type: string; new_website: string }; Returns: undefined }
      update_my_job_application: { Args: { new_status: string; target_application_id: string }; Returns: boolean }
      update_my_worker_profile: { Args: { new_availability: string; new_bio: string; new_experience_years: number; new_full_name: string; new_hourly_rate: number; new_location: string }; Returns: undefined }
    }
    Enums: {
      account_status: 'active' | 'suspended' | 'pending'
      application_status: 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn'
      job_status: 'draft' | 'open' | 'paused' | 'filled' | 'closed' | 'cancelled' | 'matched' | 'accepted' | 'in_progress' | 'completed' | 'payment_confirmed' | 'reviewed' | 'expired' | 'disputed' | 'suspended'
      user_role: 'worker' | 'employer' | 'admin'
      verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<T extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])> = (DefaultSchema['Tables'] & DefaultSchema['Views'])[T] extends { Row: infer R } ? R : never
export type TablesInsert<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T] extends { Insert: infer I } ? I : never
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T] extends { Update: infer U } ? U : never
export type Enums<T extends keyof DefaultSchema['Enums']> = DefaultSchema['Enums'][T]
