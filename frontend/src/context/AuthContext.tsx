import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type User = { name: string; email?: string };

type AuthContextType = {
  user: User | null;
  signInWithProvider: (provider: "google" | "linkedin") => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const mapUser = (u: any): User => ({
    name: u.user_metadata?.full_name || u.email?.split("@")[0] || "User",
    email: u.email || undefined,
  });

  useEffect(() => {
    if (!supabase) return;

    // Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ? mapUser(session.user) : null);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setUser(session?.user ? mapUser(session.user) : null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithProvider = async (provider: "google" | "linkedin") => {
    if (!supabase) throw new Error("Supabase not configured");

    if (provider === "linkedin") {
      throw new Error("LinkedIn login is not currently available via Supabase.");
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    if (!email || !password) throw new Error("Please provide email and password");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session?.user) throw new Error("Could not sign in, try again");

    setUser(mapUser(data.session.user));
  };

  const signOut = async () => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signInWithProvider, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};