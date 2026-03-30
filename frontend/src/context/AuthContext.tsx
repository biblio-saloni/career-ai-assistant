// TypeScript
import React, { createContext, useContext, useEffect, useState } from "react";

export type User = { name: string; email?: string };

type AuthContextType = {
  user: User | null;
  signInWithProvider: (provider: "google" | "linkedin") => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const apiBase = (import.meta.env.VITE_API_BASE as string) || "";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  const signInWithProvider = async (provider: "google" | "linkedin") => {
    // Try popup OAuth flow first. Backend must expose /auth/{provider} redirect URL.
    const popupUrl = `${apiBase}/auth/${provider}`; // e.g. http://localhost:8080/auth/google
    const popup = window.open(popupUrl, "oauth_popup", "width=600,height=700");

    if (!popup) {
      // popup blocked -> fallback to prompt
      const displayName =
        window.prompt(`Enter display name for ${provider} account:`) ||
        `${provider} user`;
      setUser({ name: displayName });
      return;
    }

    return new Promise<void>((resolve) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener("message", listener);
        try {
          popup.close();
        } catch {}
        // fallback to prompt
        const displayName =
          window.prompt(
            `OAuth timed out. Enter display name for ${provider} account:`
          ) || `${provider} user`;
        setUser({ name: displayName });
        resolve();
      }, 45000); // 45s timeout

      const listener = (e: MessageEvent) => {
        // Accept messages from any origin if you can't control callback origin,
        // but for security check e.origin in production.
        if (!e.data || e.data.type !== "oauth_result") return;
        if (e.data.provider !== provider) return;

        window.clearTimeout(timeout);
        window.removeEventListener("message", listener);
        try {
          popup.close();
        } catch {}
        const profile = e.data.profile as
          | { name?: string; email?: string }
          | undefined;
        const name =
          profile?.name || profile?.email?.split("@")[0] || `${provider} user`;
        setUser({ name, email: profile?.email });
        resolve();
      };

      window.addEventListener("message", listener);
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!email || !password) throw new Error("Missing credentials");
    const name = email.split("@")[0].replace(/\W+/g, "");
    setUser({ name: name.charAt(0).toUpperCase() + name.slice(1), email });
  };

  const signOut = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{ user, signInWithProvider, signInWithEmail, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
