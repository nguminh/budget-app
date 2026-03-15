export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          locale: 'en' | 'fr'
          default_currency: string
          plan: 'free' | 'premium'
          monthly_budget: number
          budget_preferences: Json
          onboarding_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          locale?: 'en' | 'fr'
          default_currency?: string
          plan?: 'free' | 'premium'
          monthly_budget?: number
          budget_preferences?: Json
          onboarding_completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          kind: 'expense' | 'income'
          color: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          kind: 'expense' | 'income'
          color?: string | null
          is_default?: boolean
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'expense' | 'income'
          amount: number
          currency: string
          merchant: string
          category_id: string | null
          category_name: string
          note: string | null
          transaction_date: string
          transaction_time: string
          source: 'manual'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'expense' | 'income'
          amount: number
          currency?: string
          merchant: string
          category_id?: string | null
          category_name: string
          note?: string | null
          transaction_date: string
          transaction_time?: string
          source?: 'manual'
        }
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          period_month: string
          amount: number
          currency: string
          category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period_month: string
          amount: number
          currency?: string
          category_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>
      }
    }
  }
}
