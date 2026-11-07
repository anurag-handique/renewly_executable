import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isLiveConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-key') &&
    supabaseUrl.startsWith('https://')
  );
};

// Singleton Supabase Client
export const supabase = createClient(
  isLiveConfigured() ? supabaseUrl : 'https://dummy-fallback.supabase.co',
  isLiveConfigured() ? supabaseAnonKey : 'dummy-anon-key'
);
