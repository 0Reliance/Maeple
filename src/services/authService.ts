/**
 * MAEPLE Authentication Service
 *
 * Handles user authentication with Supabase.
 * Production-ready solution for Vercel deployment.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

// Re-export User type for compatibility
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
}

export interface Session {
  user: User;
  access_token: string;
}

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
let authListeners: Array<(state: AuthState) => void> = [];

/**
 * Get current auth state
 */
export const getAuthState = (): AuthState => {
  return {
    user: currentUser,
    session: currentUser
      ? { user: currentUser, access_token: '' } // Token managed by Supabase automatically
      : null,
    isLoading: false,
    isAuthenticated: !!currentUser,
  };
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (
  callback: (state: AuthState) => void
): (() => void) => {
  authListeners.push(callback);
  return () => {
    authListeners = authListeners.filter((cb) => cb !== callback);
  };
};

/**
 * Notify all listeners of auth state change
 */
const notifyListeners = () => {
  const state = getAuthState();
  authListeners.forEach((cb) => cb(state));
};

/**
 * Adapt Supabase user to our User interface
 */
const adaptUser = (supabaseUser: any): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
    createdAt: supabaseUser.created_at,
    user_metadata: supabaseUser.user_metadata,
  };
};

/**
 * Initialize auth state (call on app startup)
 */
export const initializeAuth = async (): Promise<AuthState> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured. Running in local-only mode.');
    return getAuthState();
  }

  // Check for existing session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Auth initialization error:', error);
    currentUser = null;
  } else if (session?.user) {
    currentUser = adaptUser(session.user);
  } else {
    currentUser = null;
  }

  // Set up real-time auth state listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user) {
        currentUser = adaptUser(session.user);
      } else {
        currentUser = null;
      }
      
      notifyListeners();
    }
  );

  notifyListeners();
  return getAuthState();
};

// ============================================
// SIGN UP
// ============================================

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  if (!isSupabaseConfigured) {
    return { user: null, error: { message: 'Supabase not configured' } };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName || email.split('@')[0],
      },
    },
  });

  if (error) {
    console.error('Sign up error:', error);
    return { user: null, error: { message: error.message, code: error.status?.toString() } };
  }

  if (data?.user) {
    currentUser = adaptUser(data.user);
    notifyListeners();
    return { user: currentUser, error: null };
  }

  return { user: null, error: { message: 'Unknown error occurred' } };
};

// ============================================
// SIGN IN
// ============================================

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  if (!isSupabaseConfigured) {
    return { user: null, error: { message: 'Supabase not configured' } };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error);
    return { user: null, error: { message: error.message, code: error.status?.toString() } };
  }

  if (data?.user) {
    currentUser = adaptUser(data.user);
    notifyListeners();
    return { user: currentUser, error: null };
  }

  return { user: null, error: { message: 'Unknown error occurred' } };
};

// ============================================
// SIGN OUT
// ============================================

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  if (!isSupabaseConfigured) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { error } = await supabase.auth.signOut();
  
  currentUser = null;
  notifyListeners();
  
  if (error) {
    console.error('Sign out error:', error);
    return { error: { message: error.message, code: error.status?.toString() } };
  }
  
  return { error: null };
};

// ============================================
// MAGIC LINK
// ============================================

export const signInWithMagicLink = async (email: string) => {
  if (!isSupabaseConfigured) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Magic link error:', error);
    return { error: { message: error.message } };
  }

  return { error: null };
};

// ============================================
// OAUTH
// ============================================

export const signInWithOAuth = async (provider: 'google' | 'github' | 'gitlab') => {
  if (!isSupabaseConfigured) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('OAuth error:', error);
    return { error: { message: error.message } };
  }

  return { data, error: null };
};

// ============================================
// PASSWORD RESET
// ============================================

export const resetPassword = async (email: string) => {
  if (!isSupabaseConfigured) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    console.error('Password reset error:', error);
    return { error: { message: error.message } };
  }

  return { error: null };
};

export const updatePassword = async (password: string) => {
  if (!isSupabaseConfigured) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error('Password update error:', error);
    return { error: { message: error.message } };
  }

  return { error: null };
};

// ============================================
// PROFILE MANAGEMENT
// ============================================

export const updateProfile = async (data: {
  full_name?: string;
  avatar_url?: string;
  [key: string]: any;
}) => {
  if (!isSupabaseConfigured) {
    return { error: { message: 'Supabase not configured' } };
  }

  const { data: userData, error } = await supabase.auth.updateUser({
    data,
  });

  if (error) {
    console.error('Profile update error:', error);
    return { error: { message: error.message } };
  }

  if (userData?.user) {
    currentUser = adaptUser(userData.user);
    notifyListeners();
  }

  return { error: null };
};

export const getProfile = async () => currentUser;

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const isCloudSyncAvailable = () => isSupabaseConfigured && !!currentUser;
export const getCurrentUserId = () => currentUser?.id || null;
export const getCurrentUserEmail = () => currentUser?.email || null;

// Export supabase client for direct access if needed
export { supabase };