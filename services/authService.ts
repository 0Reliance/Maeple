/**
 * MAEPLE Authentication Service
 * 
 * Handles user authentication with Supabase Auth.
 * Supports email/password, magic link, and OAuth providers.
 */

import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthError {
  message: string;
  code?: string;
}

// ============================================
// AUTH STATE
// ============================================

let currentUser: User | null = null;
let currentSession: Session | null = null;
let authListeners: Array<(state: AuthState) => void> = [];

/**
 * Get current auth state
 */
export const getAuthState = (): AuthState => {
  return {
    user: currentUser,
    session: currentSession,
    isLoading: false,
    isAuthenticated: !!currentUser,
  };
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback: (state: AuthState) => void): (() => void) => {
  authListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    authListeners = authListeners.filter(cb => cb !== callback);
  };
};

/**
 * Notify all listeners of auth state change
 */
const notifyListeners = () => {
  const state = getAuthState();
  authListeners.forEach(cb => cb(state));
};

/**
 * Initialize auth state (call on app startup)
 */
export const initializeAuth = async (): Promise<AuthState> => {
  const client = getSupabaseClient();
  if (!client) {
    return { user: null, session: null, isLoading: false, isAuthenticated: false };
  }

  // Get initial session
  const { data: { session } } = await client.auth.getSession();
  currentSession = session;
  currentUser = session?.user || null;

  // Set up auth state listener
  client.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    console.log('Auth state changed:', event);
    currentSession = session;
    currentUser = session?.user || null;
    notifyListeners();
  });

  return getAuthState();
};

// ============================================
// SIGN UP
// ============================================

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { user: null, error: { message: 'Supabase not configured' } };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName,
      },
    },
  });

  if (error) {
    return { user: null, error: { message: error.message, code: error.name } };
  }

  return { user: data.user, error: null };
};

// ============================================
// SIGN IN
// ============================================

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { user: null, error: { message: 'Supabase not configured' } };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: { message: error.message, code: error.name } };
  }

  return { user: data.user, error: null };
};

/**
 * Sign in with magic link (passwordless)
 */
export const signInWithMagicLink = async (
  email: string
): Promise<{ error: AuthError | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    return { error: { message: error.message, code: error.name } };
  }

  return { error: null };
};

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 */
export const signInWithOAuth = async (
  provider: 'google' | 'github' | 'apple'
): Promise<{ error: AuthError | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    return { error: { message: error.message, code: error.name } };
  }

  return { error: null };
};

// ============================================
// SIGN OUT
// ============================================

/**
 * Sign out current user
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { error } = await client.auth.signOut();

  if (error) {
    return { error: { message: error.message, code: error.name } };
  }

  currentUser = null;
  currentSession = null;
  notifyListeners();

  return { error: null };
};

// ============================================
// PASSWORD RESET
// ============================================

/**
 * Send password reset email
 */
export const resetPassword = async (
  email: string
): Promise<{ error: AuthError | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    return { error: { message: error.message, code: error.name } };
  }

  return { error: null };
};

/**
 * Update password (after reset link clicked)
 */
export const updatePassword = async (
  newPassword: string
): Promise<{ error: AuthError | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { error } = await client.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: { message: error.message, code: error.name } };
  }

  return { error: null };
};

// ============================================
// PROFILE
// ============================================

/**
 * Update user profile
 */
export const updateProfile = async (data: {
  displayName?: string;
  avatarUrl?: string;
}): Promise<{ error: AuthError | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { error } = await client.auth.updateUser({
    data: {
      full_name: data.displayName,
      avatar_url: data.avatarUrl,
    },
  });

  if (error) {
    return { error: { message: error.message, code: error.name } };
  }

  return { error: null };
};

/**
 * Get user profile from profiles table
 */
export const getProfile = async (): Promise<{
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
} | null> => {
  const client = getSupabaseClient();
  if (!client || !currentUser) return null;

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
  };
};

// ============================================
// UTILITIES
// ============================================

/**
 * Check if cloud sync is available (configured + authenticated)
 */
export const isCloudSyncAvailable = (): boolean => {
  return isSupabaseConfigured() && !!currentUser;
};

/**
 * Get current user ID
 */
export const getCurrentUserId = (): string | null => {
  return currentUser?.id || null;
};

/**
 * Get current user email
 */
export const getCurrentUserEmail = (): string | null => {
  return currentUser?.email || null;
};
