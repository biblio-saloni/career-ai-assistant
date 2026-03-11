import { AppBar, Toolbar, Typography, Button } from "@mui/material"
import { useNavigate } from "react-router-dom"

export default function Header() {
  const navigate = useNavigate()

  return (
    <AppBar
      position="static"
      sx={{
        background: "linear-gradient(90deg, #020617, #0f172a)",
        boxShadow: "none",
        padding: "8px 24px"
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        
        {/* App Name */}
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          The 6th Sense
        </Typography>

        {/* Right Button */}
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => navigate("/upload")}
        >
          Get Started
        </Button>

      </Toolbar>
    </AppBar>
  )
}