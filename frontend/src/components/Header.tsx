import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../styles/theme.css";

export default function Header() {
  const navigate = useNavigate();

  return (
    <AppBar position="static" className="header-app-bar">
      <Toolbar className="header-toolbar">
        <Typography
          variant="h6"
          className="header-title"
          onClick={() => navigate("/")}
        >
          The 6th Sense
        </Typography>
        <Button
          variant="outlined"
          color="inherit"
          className="header-button"
          onClick={() => navigate("/upload")}
        >
          Get Started
        </Button>
      </Toolbar>
    </AppBar>
  );
}