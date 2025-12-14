/**
 * MAEPLE Authentication Service
 *
 * Handles user authentication with Local API.
 * Replaces previous Supabase implementation.
 */

import * as apiClient from "./apiClient";

// Re-export User type from apiClient or define compatible one
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt?: string;
  // Compatibility fields for components expecting Supabase-like structure
  user_metadata?: {
    full_name?: string;
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
      ? { user: currentUser, access_token: apiClient.getToken() || "" }
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
 * Initialize auth state (call on app startup)
 */
export const initializeAuth = async (): Promise<AuthState> => {
  if (apiClient.hasToken()) {
    const { user, error } = await apiClient.getCurrentUser();
    if (user) {
      currentUser = adaptUser(user);
    } else {
      apiClient.clearToken();
      currentUser = null;
    }
  } else {
    currentUser = null;
  }
  notifyListeners();
  return getAuthState();
};

// Helper to adapt API user to expected structure
const adaptUser = (apiUser: apiClient.User): User => {
  return {
    ...apiUser,
    user_metadata: {
      full_name: apiUser.displayName,
    },
  };
};

// ============================================
// SIGN UP
// ============================================

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  const { user, error } = await apiClient.signUp(email, password, displayName);
  if (error) {
    return { user: null, error: { message: error } };
  }
  if (user) {
    currentUser = adaptUser(user);
    notifyListeners();
    return { user: currentUser, error: null };
  }
  return { user: null, error: { message: "Unknown error" } };
};

// ============================================
// SIGN IN
// ============================================

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  const { user, error } = await apiClient.signIn(email, password);
  if (error) {
    return { user: null, error: { message: error } };
  }
  if (user) {
    currentUser = adaptUser(user);
    notifyListeners();
    return { user: currentUser, error: null };
  }
  return { user: null, error: { message: "Unknown error" } };
};

// ============================================
// SIGN OUT
// ============================================

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  await apiClient.signOut();
  currentUser = null;
  notifyListeners();
  return { error: null };
};

// ============================================
// STUBS / UNIMPLEMENTED
// ============================================

export const signInWithMagicLink = async (email: string) => ({
  error: { message: "Not supported in local mode" },
});
export const signInWithOAuth = async (provider: string) => ({
  error: { message: "Not supported in local mode" },
});
export const resetPassword = async (email: string) => ({
  error: { message: "Not supported in local mode" },
});
export const updatePassword = async (password: string) => ({
  error: { message: "Not supported in local mode" },
});
export const updateProfile = async (data: any) => ({
  error: { message: "Not supported in local mode" },
});

export const getProfile = async () => currentUser;
export const isCloudSyncAvailable = () => !!currentUser;
export const getCurrentUserId = () => currentUser?.id || null;
export const getCurrentUserEmail = () => currentUser?.email || null;
