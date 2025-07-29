import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          title: string;
          description: string;
          target_amount: number;
          current_amount: number;
          currency: string;
          region_id: string;
          images: string[];
          ngo_address: string;
          created_at: string;
          category: 'water' | 'education' | 'health' | 'agriculture' | 'infrastructure';
          milestones: any[];
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      african_regions: {
        Row: {
          id: string;
          country: string;
          region: string;
          local_currency: string;
          mobile_money_providers: string[];
          language_preferences: string[];
          flag_emoji: string;
        };
      };
      african_impact_metrics: {
        Row: {
          id: string;
          water_access_improved: number;
          schools_built: number;
          health_clinics_supported: number;
          jobs_created: number;
          communities_reached: number;
          local_currency_impact: Record<string, number>;
          projects_by_category: Record<string, number>;
          updated_at: string;
        };
      };
      donation_transactions: {
        Row: {
          id: string;
          project_id: string;
          milestone_id?: string;
          amount: number;
          currency: string;
          payment_method: 'mobile_money' | 'card' | 'crypto';
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'queued';
          tx_hash?: string;
          donor_address?: string;
          timestamp: string;
          offline: boolean;
          stripe_payment_intent_id?: string;
          mobile_money_provider?: string;
        };
        Insert: Omit<Database['public']['Tables']['donation_transactions']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['donation_transactions']['Insert']>;
      };
    };
  };
}