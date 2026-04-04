import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      navigate("/login");
      return;
    }

    // detectSessionInUrl:true in supabaseClient handles the code exchange automatically.
    // We just wait for the auth state to settle.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (event === "SIGNED_IN" && session) {
          navigate("/");
        } else if (event === "TOKEN_REFRESHED") {
          navigate("/");
        }
      },
    );

    // Fallback: if session already exists by the time we get here
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) navigate("/");
    });

    return () => authListener?.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div style={{ padding: "24px", textAlign: "center" }}>
      <p>Signing you in...</p>
    </div>
  );
}
