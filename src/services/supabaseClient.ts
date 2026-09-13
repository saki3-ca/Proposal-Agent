// Supabase API Integration Helper
// Expects VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-placeholder',
  isConfigured: Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
};

export class SupabaseService {
  static getStatus() {
    return {
      isConfigured: SUPABASE_CONFIG.isConfigured,
      url: SUPABASE_CONFIG.url,
      message: SUPABASE_CONFIG.isConfigured
        ? 'Connected to Supabase PostgreSQL & Storage'
        : 'Running in Local Mock Mode (Set VITE_SUPABASE_URL in .env to connect live DB)'
    };
  }
}
