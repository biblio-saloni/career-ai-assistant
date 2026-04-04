import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase init - URL:", supabaseUrl ? "✓ set" : "✗ missing");
console.log(
  "Supabase init - Key:",
  supabaseAnonKey
    ? "✓ set (length: " + supabaseAnonKey.length + ")"
    : "✗ missing",
);

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          flowType: "pkce",
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: window.localStorage, // ← explicit, survives the OAuth redirect
        },
      })
    : null;
