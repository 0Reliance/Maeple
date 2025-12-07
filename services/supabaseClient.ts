/**
 * MAEPLE Supabase Client
 * 
 * Initializes and exports the Supabase client for cloud storage and auth.
 * Part of MAEPLE's hybrid local-first + cloud sync architecture.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables (set in .env or deployment platform)
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Singleton client instance
let supabaseClient: SupabaseClient | null = null;

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

/**
 * Get or create the Supabase client instance
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Running in local-only mode.');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
};

/**
 * Get the Supabase client (throws if not configured)
 */
export const requireSupabaseClient = (): SupabaseClient => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return client;
};

export { SupabaseClient };
