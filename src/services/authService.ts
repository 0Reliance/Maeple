/**
 * MAEPLE Authentication Service
 *
 * Handles user authentication with Supabase (cloud) or Local API (development).
 * Automatically falls back to local API when Supabase is not configured.
 */

import { getSupabaseClient, isSupabaseConfigured, supabase } from "./supabaseClient";

// Local API base URL - use relative path for same-origin requests
const LOCAL_API_URL = '/api';

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
  isSupabaseConfigured: boolean;
  isLocalMode: boolean;
}

export interface AuthError {
  message: string;
  code?: string;
}

// ============================================
// AUTH STATE
// ============================================

let currentUser: User | null = null;
let currentToken: string | null = null;
let authListeners: Array<(state: AuthState) => void> = [];

// Check if local API is available
const checkLocalApi = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${LOCAL_API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

// Determine if we're in local mode (Supabase not configured but local API available)
let isLocalMode = !isSupabaseConfigured;

/**
 * Get current auth state
 */
export const getAuthState = (): AuthState => {
  return {
    user: currentUser,
    session: currentUser
      ? { user: currentUser, access_token: currentToken || "" }
      : null,
    isLoading: false,
    isAuthenticated: !!currentUser,
    isSupabaseConfigured,
    isLocalMode,
  };
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback: (state: AuthState) => void): (() => void) => {
  authListeners.push(callback);
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
 * Adapt Supabase user to our User interface
 */
const adaptUser = (supabaseUser: any): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    displayName:
      supabaseUser.user_metadata?.full_name || supabaseUser.email?.split("@")[0] || "User",
    createdAt: supabaseUser.created_at,
    user_metadata: supabaseUser.user_metadata,
  };
};

/**
 * Initialize auth state (call on app startup)
 */
export const initializeAuth = async (): Promise<AuthState> => {
  // Try local API first if Supabase is not configured
  if (!isSupabaseConfigured) {
    isLocalMode = true;
    console.log("[Auth] Supabase not configured. Using local API mode.");
    
    // Check for stored token in localStorage
    const storedToken = localStorage.getItem('maeple_auth_token');
    const storedUser = localStorage.getItem('maeple_auth_user');
    
    if (storedToken && storedUser) {
      try {
        // Verify token is still valid
        const response = await fetch(`${LOCAL_API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          currentUser = {
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.displayName || data.user.email.split('@')[0],
            createdAt: data.user.createdAt,
          };
          currentToken = storedToken;
          notifyListeners();
          return getAuthState();
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('maeple_auth_token');
          localStorage.removeItem('maeple_auth_user');
        }
      } catch (err) {
        console.warn("[Auth] Failed to verify stored token:", err);
      }
    }
    
    return getAuthState();
  }

  // Use Supabase if configured
  const client = getSupabaseClient();

  // Check for existing session
  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error) {
    console.error("Auth initialization error:", error);
    currentUser = null;
  } else if (session?.user) {
    currentUser = adaptUser(session.user);
  } else {
    currentUser = null;
  }

  // Set up real-time auth state listener
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(async (event, session) => {
    console.log("Auth state changed:", event);

    if (session?.user) {
      currentUser = adaptUser(session.user);
    } else {
      currentUser = null;
    }

    notifyListeners();
  });

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
  // Use local API if Supabase is not configured
  if (!isSupabaseConfigured) {
    try {
      const response = await fetch(`${LOCAL_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: displayName }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { user: null, error: { message: data.error || 'Sign up failed', code: response.status.toString() } };
      }
      
      // Store token and user
      if (data.token) {
        localStorage.setItem('maeple_auth_token', data.token);
        localStorage.setItem('maeple_auth_user', JSON.stringify(data.user));
        currentToken = data.token;
      }
      
      currentUser = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName || email.split('@')[0],
        createdAt: data.user.createdAt,
      };
      
      notifyListeners();
      return { user: currentUser, error: null };
    } catch (err) {
      console.error('[Auth] Local API sign up error:', err);
      return { 
        user: null, 
        error: { message: err instanceof Error ? err.message : 'Network error', code: 'NETWORK_ERROR' } 
      };
    }
  }

  // Use Supabase
  try {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName || email.split("@")[0],
        },
      },
    });

    if (error) {
      console.error("Sign up error:", error);
      return { user: null, error: { message: error.message, code: error.status?.toString() } };
    }

    if (data?.user) {
      currentUser = adaptUser(data.user);
      notifyListeners();
      return { user: currentUser, error: null };
    }

    return { user: null, error: { message: "Unknown error occurred" } };
  } catch (err) {
    // Handle network errors (DNS, connection refused, etc.)
    const networkError = err instanceof Error && 
      (err.message.includes('Failed to fetch') || 
       err.message.includes('NetworkError') ||
       err.message.includes('ERR_NAME_NOT_RESOLVE'));
    
    if (networkError) {
      console.warn('[Auth] Network error during sign up:', err);
      return { 
        user: null, 
        error: { 
          message: "Unable to connect to authentication server. The app works offline - your data is saved locally.", 
          code: "NETWORK_ERROR" 
        } 
      };
    }
    
    console.error('[Auth] Unexpected error during sign up:', err);
    return { 
      user: null, 
      error: { 
        message: err instanceof Error ? err.message : "An unexpected error occurred", 
        code: "UNKNOWN_ERROR" 
      } 
    };
  }
};

// ============================================
// SIGN IN
// ============================================

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  // Use local API if Supabase is not configured
  if (!isSupabaseConfigured) {
    try {
      const response = await fetch(`${LOCAL_API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { user: null, error: { message: data.error || 'Invalid email or password', code: response.status.toString() } };
      }
      
      // Store token and user
      if (data.token) {
        localStorage.setItem('maeple_auth_token', data.token);
        localStorage.setItem('maeple_auth_user', JSON.stringify(data.user));
        currentToken = data.token;
      }
      
      currentUser = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName || email.split('@')[0],
        createdAt: data.user.createdAt,
      };
      
      notifyListeners();
      return { user: currentUser, error: null };
    } catch (err) {
      console.error('[Auth] Local API sign in error:', err);
      return { 
        user: null, 
        error: { message: err instanceof Error ? err.message : 'Network error', code: 'NETWORK_ERROR' } 
      };
    }
  }

  // Use Supabase
  try {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      return { user: null, error: { message: error.message, code: error.status?.toString() } };
    }

    if (data?.user) {
      currentUser = adaptUser(data.user);
      notifyListeners();
      return { user: currentUser, error: null };
    }

    return { user: null, error: { message: "Unknown error occurred" } };
  } catch (err) {
    // Handle network errors (DNS, connection refused, etc.)
    const networkError = err instanceof Error && 
      (err.message.includes('Failed to fetch') || 
       err.message.includes('NetworkError') ||
       err.message.includes('ERR_NAME_NOT_RESOLVE'));
    
    if (networkError) {
      console.warn('[Auth] Network error during sign in:', err);
      return { 
        user: null, 
        error: { 
          message: "Unable to connect to authentication server. The app works offline - your data is saved locally.", 
          code: "NETWORK_ERROR" 
        } 
      };
    }
    
    console.error('[Auth] Unexpected error during sign in:', err);
    return { 
      user: null, 
      error: { 
        message: err instanceof Error ? err.message : "An unexpected error occurred", 
        code: "UNKNOWN_ERROR" 
      } 
    };
  }
};

// ============================================
// SIGN OUT
// ============================================

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  // Local mode sign out
  if (!isSupabaseConfigured) {
    try {
      const token = localStorage.getItem('maeple_auth_token');
      if (token) {
        await fetch(`${LOCAL_API_URL}/auth/signout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.warn('[Auth] Local API sign out error:', err);
    }
    
    // Clear local storage regardless of API call success
    localStorage.removeItem('maeple_auth_token');
    localStorage.removeItem('maeple_auth_user');
    currentUser = null;
    currentToken = null;
    notifyListeners();
    return { error: null };
  }

  // Supabase sign out
  const { error } = await getSupabaseClient().auth.signOut();

  currentUser = null;
  notifyListeners();

  if (error) {
    console.error("Sign out error:", error);
    return { error: { message: error.message, code: error.status?.toString() } };
  }

  return { error: null };
};

// ============================================
// MAGIC LINK
// ============================================

export const signInWithMagicLink = async (email: string): Promise<{ error: AuthError | null }> => {
  if (!isSupabaseConfigured) {
    return { error: { message: "Magic link sign-in is not available in local development mode. Please use email and password.", code: "NOT_AVAILABLE" } };
  }

  try {
    const { error } = await getSupabaseClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Magic link error:", error);
      return { error: { message: error.message } };
    }

    return { error: null };
  } catch (err) {
    const networkError = err instanceof Error && 
      (err.message.includes('Failed to fetch') || 
       err.message.includes('NetworkError'));
    
    if (networkError) {
      return { 
        error: { 
          message: "Unable to connect to authentication server. Please try again later.", 
          code: "NETWORK_ERROR" 
        } 
      };
    }
    
    return { error: { message: err instanceof Error ? err.message : "An unexpected error occurred" } };
  }
};

// ============================================
// OAUTH
// ============================================

export const signInWithOAuth = async (provider: "google" | "github" | "gitlab") => {
  if (!isSupabaseConfigured) {
    return { error: { message: "Supabase not configured" } };
  }

  const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("OAuth error:", error);
    return { error: { message: error.message } };
  }

  return { data, error: null };
};

// ============================================
// PASSWORD RESET
// ============================================

export const resetPassword = async (email: string) => {
  if (!isSupabaseConfigured) {
    return { error: { message: "Supabase not configured" } };
  }

  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    console.error("Password reset error:", error);
    return { error: { message: error.message } };
  }

  return { error: null };
};

export const updatePassword = async (password: string) => {
  if (!isSupabaseConfigured) {
    return { error: { message: "Supabase not configured" } };
  }

  const { error } = await getSupabaseClient().auth.updateUser({ password });

  if (error) {
    console.error("Password update error:", error);
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
    return { error: { message: "Supabase not configured" } };
  }

  const { data: userData, error } = await getSupabaseClient().auth.updateUser({
    data,
  });

  if (error) {
    console.error("Profile update error:", error);
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
