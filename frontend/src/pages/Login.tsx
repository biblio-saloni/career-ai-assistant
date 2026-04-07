import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/theme.css";

type Mode = "signin" | "signup";

export default function Login() {
  const { signInWithProvider, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isSignUp = mode === "signup";

  const switchMode = (next: Mode) => {
    setMode(next);
    setErr(null);
    setInfo(null);
    setEmail("");
    setPassword("");
    setConfirm("");
  };

  const onProvider = async (provider: "google" | "linkedin") => {
    setLoading(true);
    setErr(null);
    setInfo(null);
    try {
      await signInWithProvider(provider);
    } catch (e: any) {
      setErr(e.message || "Failed to sign in");
      setLoading(false);
    }
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);
    setInfo(null);

    if (!email || !password) {
      setErr("Please fill in all fields.");
      return;
    }

    if (isSignUp) {
      if (password.length < 8) {
        setErr("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirm) {
        setErr("Passwords don't match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { supabase } = await import("../lib/supabaseClient");
        if (!supabase) throw new Error("Supabase not configured");

        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          // Supabase returns this when the email already exists
          if (
            error.message?.toLowerCase().includes("already") ||
            error.message?.toLowerCase().includes("registered") ||
            error.message?.toLowerCase().includes("exists")
          ) {
            setErr(null);
            setInfo(
              "⚡ Looks like you already have an account. Signing you in instead...",
            );
            setTimeout(() => switchMode("signin"), 2000);
          } else {
            throw error;
          }
        } else if (data.user && !data.session) {
          // Email confirmation required
          setInfo(
            "📬 Check your inbox! We've sent a confirmation link to " + email,
          );
        } else if (data.session) {
          navigate("/");
        }
      } else {
        await signInWithEmail(email, password);
        navigate("/");
      }
    } catch (e: any) {
      const msg: string = e.message || "";
      if (
        !isSignUp &&
        (msg.toLowerCase().includes("invalid") ||
          msg.toLowerCase().includes("credentials") ||
          msg.toLowerCase().includes("password"))
      ) {
        setErr("Wrong email or password. New here? ");
        setInfo("new_user_hint");
      } else {
        setErr(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <h1 className="login-title">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h1>
          <p className="login-subtitle">
            {isSignUp
              ? "Start decoding your career trajectory today"
              : "Sign in to continue your career intelligence journey"}
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="login-oauth">
          <button
            className="login-oauth-btn"
            onClick={() => onProvider("google")}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            className="login-oauth-btn"
            onClick={() => onProvider("linkedin")}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0077B5">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Continue with LinkedIn
          </button>
        </div>

        {/* Divider */}
        <div className="login-divider">
          <span className="login-divider-line" />
          <span className="login-divider-text">
            {isSignUp ? "or sign up with email" : "or sign in with email"}
          </span>
          <span className="login-divider-line" />
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              type="email"
              className="login-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {isSignUp && <p className="login-hint">Minimum 8 characters</p>}
          </div>

          {isSignUp && (
            <div className="login-field">
              <label className="login-label">Confirm Password</label>
              <input
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {/* Error */}
          {err && (
            <div className="login-error">
              {err}
              {err.includes("New here") && (
                <span
                  className="login-error-link"
                  onClick={() => switchMode("signup")}
                >
                  Create an account →
                </span>
              )}
            </div>
          )}

          {/* Info / success */}
          {info && info !== "new_user_hint" && (
            <div className="login-info">{info}</div>
          )}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading
              ? "Please wait..."
              : isSignUp
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        {/* Mode toggle */}
        <p className="login-signup-text">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <span
            className="login-signup-link"
            onClick={() => switchMode(isSignUp ? "signin" : "signup")}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}
