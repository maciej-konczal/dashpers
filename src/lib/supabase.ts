
import { createClient } from '@supabase/supabase-js';

let supabase: ReturnType<typeof createClient>;

const initSupabase = async () => {
  if (supabase) return supabase;

  try {
    const response = await fetch('https://lftfifzcjiaaypkqxgxc.supabase.co/functions/v1/get-supabase-config');
    const { url, anonKey } = await response.json();

    if (!url || !anonKey) {
      throw new Error('Invalid Supabase configuration');
    }

    supabase = createClient(url, anonKey);
    return supabase;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
};

// Initialize the client
initSupabase();

// Export a function to get the initialized client
export const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  return supabase;
};

export { supabase };
