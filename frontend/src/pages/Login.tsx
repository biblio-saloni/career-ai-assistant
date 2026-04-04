import React, { useState } from "react";
import { Box, Button, TextField, Typography, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/theme.css";

export default function Login() {
  const { signInWithProvider, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onProvider = async (provider: "google" | "linkedin") => {
    setLoading(true);
    setErr(null);
    try {
      console.log("Initiating provider login:", provider);
      await signInWithProvider(provider);
      console.log("Provider login successful");
      // Don't navigate - OAuth redirect will handle it
      // navigate(-1);
    } catch (e: any) {
      const errMsg = e.message || "Failed to sign in";
      console.error("Provider login error:", errMsg);
      setErr(errMsg);
      setLoading(false);
    }
  };

  const onEmailSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await signInWithEmail(email, password);
      navigate(-1);
    } catch (e: any) {
      setErr(e.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-page">
      <Box className="login-card">
        <Typography variant="h5">Sign in</Typography>

        <Box mt={2} mb={2}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onProvider("google")}
            disabled={loading}
          >
            Continue with Google
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onProvider("linkedin")}
            disabled={loading}
            sx={{ mt: 1 }}
          >
            Continue with LinkedIn
          </Button>
        </Box>

        <Divider sx={{ my: 2 }}>or</Divider>

        <form onSubmit={onEmailSignIn}>
          <TextField
            label="Email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />
          {err && <Typography color="error">{err}</Typography>}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            Sign in with Email
          </Button>
        </form>
      </Box>
    </Box>
  );
}
