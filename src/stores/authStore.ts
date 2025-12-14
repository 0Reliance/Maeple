/**
 * MAEPLE Auth Store
 *
 * Manages authentication state with Local API.
 * Provides reactive auth state across the app.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  initializeAuth,
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  signOut,
  resetPassword,
  onAuthStateChange,
  AuthState,
  AuthError,
  User,
  Session,
} from "../services/authService";

// ============================================
// TYPES
// ============================================

interface AuthStoreState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
}

interface AuthStoreActions {
  // Auth actions
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<boolean>;
  sendMagicLink: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: AuthError | null) => void;
  clearError: () => void;

  // Initialization
  initialize: () => Promise<void>;
  initializeAuth: () => Promise<void>; // Alias for initialize
}

type AuthStore = AuthStoreState & AuthStoreActions;

// ============================================
// INITIAL STATE
// ============================================

const initialState: AuthStoreState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// ============================================
// STORE
// ============================================

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Auth actions
      signIn: async (email, password) => {
        set({ isLoading: true, error: null }, false, "signIn:start");

        const { user, error } = await signInWithEmail(email, password);

        if (error) {
          set({ isLoading: false, error }, false, "signIn:error");
          return false;
        }

        set(
          {
            user,
            isAuthenticated: !!user,
            isLoading: false,
            error: null,
          },
          false,
          "signIn:success"
        );

        return true;
      },

      signUp: async (email, password, displayName) => {
        set({ isLoading: true, error: null }, false, "signUp:start");

        const { user, error } = await signUpWithEmail(
          email,
          password,
          displayName
        );

        if (error) {
          set({ isLoading: false, error }, false, "signUp:error");
          return false;
        }

        set(
          {
            user,
            isAuthenticated: !!user,
            isLoading: false,
            error: null,
          },
          false,
          "signUp:success"
        );

        return true;
      },

      sendMagicLink: async (email) => {
        set({ isLoading: true, error: null }, false, "sendMagicLink:start");

        const { error } = await signInWithMagicLink(email);

        if (error) {
          set({ isLoading: false, error }, false, "sendMagicLink:error");
          return false;
        }

        set({ isLoading: false, error: null }, false, "sendMagicLink:success");
        return true;
      },

      logout: async () => {
        set({ isLoading: true }, false, "logout:start");

        await signOut();

        set(
          {
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          },
          false,
          "logout:complete"
        );
      },

      sendPasswordReset: async (email) => {
        set({ isLoading: true, error: null }, false, "sendPasswordReset:start");

        const { error } = await resetPassword(email);

        if (error) {
          set({ isLoading: false, error }, false, "sendPasswordReset:error");
          return false;
        }

        set(
          { isLoading: false, error: null },
          false,
          "sendPasswordReset:success"
        );
        return true;
      },

      // State management
      setLoading: (loading) => {
        set({ isLoading: loading }, false, "setLoading");
      },

      setError: (error) => {
        set({ error }, false, "setError");
      },

      clearError: () => {
        set({ error: null }, false, "clearError");
      },

      // Initialization
      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true }, false, "initialize:start");

        try {
          const authState = await initializeAuth();

          set(
            {
              user: authState.user,
              session: authState.session,
              isAuthenticated: authState.isAuthenticated,
              isInitialized: true,
              isLoading: false,
            },
            false,
            "initialize:complete"
          );

          // Subscribe to auth changes
          onAuthStateChange((state: AuthState) => {
            set(
              {
                user: state.user,
                session: state.session,
                isAuthenticated: state.isAuthenticated,
              },
              false,
              "authStateChange"
            );
          });
        } catch (error) {
          console.error("Auth initialization failed:", error);
          set(
            {
              isInitialized: true,
              isLoading: false,
              error: { message: "Failed to initialize authentication" },
            },
            false,
            "initialize:error"
          );
        }
      },

      // Alias for initialize - used in App.tsx
      initializeAuth: async () => {
        return get().initialize();
      },
    }),
    { name: "AuthStore" }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) =>
  state.isAuthenticated;
export const selectIsAuthLoading = (state: AuthStore) => state.isLoading;
export const selectAuthError = (state: AuthStore) => state.error;
