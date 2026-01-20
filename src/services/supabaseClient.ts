/**
 * Supabase Client Configuration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase URL and Anon Key from environment variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials not found. Using local storage mode only.');
}

// Only create client if properly configured, otherwise null
// This prevents invalid API calls when credentials aren't set
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/**
 * Helper to safely get the Supabase client
 * Throws if Supabase is not configured when you need it
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }
  return supabase;
}