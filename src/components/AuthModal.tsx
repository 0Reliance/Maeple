/**
 * MAEPLE Auth Modal
 *
 * Sign in/up modal for cloud sync authentication.
 * Supports email/password and magic link.
 */

import React, { useState } from "react";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  AuthError,
} from "../services/authService";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMode = "signin" | "signup" | "magic";

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "magic") {
        const { error } = await signInWithMagicLink(email);
        if (error) throw new Error(error.message);
        setMagicLinkSent(true);
      } else if (mode === "signup") {
        const { user, error } = await signUpWithEmail(
          email,
          password,
          displayName
        );
        if (error) throw new Error(error.message);
        if (user) {
          onSuccess();
          onClose();
        }
      } else {
        const { user, error } = await signInWithEmail(email, password);
        if (error) throw new Error(error.message);
        if (user) {
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setError(null);
    setMagicLinkSent(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {mode === "signin"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Magic Link"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Magic Link Success */}
        {magicLinkSent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              Check your email!
            </h3>
            <p className="text-slate-400 text-sm">
              We sent a magic link to{" "}
              <strong className="text-white">{email}</strong>. Click the link to
              sign in.
            </p>
            <button
              onClick={() => {
                resetForm();
                setMode("signin");
              }}
              className="mt-6 text-teal-400 hover:text-teal-300 text-sm"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message - Enhanced for network errors */}
            {error && (
              <div className={`p-3 rounded-lg text-sm ${
                error.includes('offline') || error.includes('connect') || error.includes('network')
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                  : 'bg-red-500/20 border border-red-500/50 text-red-300'
              }`}>
                <div className="flex items-start gap-2">
                  {(error.includes('offline') || error.includes('connect') || error.includes('network')) && (
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                    </svg>
                  )}
                  <div>
                    <p>{error}</p>
                    {(error.includes('offline') || error.includes('connect')) && (
                      <p className="mt-1 text-xs opacity-75">
                        💡 You can still use the app - all data is saved locally.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Display Name (signup only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Password (not for magic link) */}
            {mode !== "magic" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : mode === "signin" ? (
                "Sign In"
              ) : mode === "signup" ? (
                "Create Account"
              ) : (
                "Send Magic Link"
              )}
            </button>

            {/* Mode Switchers */}
            <div className="pt-4 border-t border-slate-700 space-y-2 text-center text-sm">
              {mode === "signin" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode("signup");
                    }}
                    className="text-teal-400 hover:text-teal-300 block w-full"
                  >
                    Don't have an account? Sign up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode("magic");
                    }}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Sign in with magic link instead
                  </button>
                </>
              )}
              {mode === "signup" && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMode("signin");
                  }}
                  className="text-teal-400 hover:text-teal-300"
                >
                  Already have an account? Sign in
                </button>
              )}
              {mode === "magic" && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMode("signin");
                  }}
                  className="text-teal-400 hover:text-teal-300"
                >
                  Sign in with password instead
                </button>
              )}
            </div>
          </form>
        )}

        {/* Privacy Note */}
        <p className="mt-4 text-xs text-slate-500 text-center">
          🔒 Your data is encrypted. We never share your information.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
