import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../styles/theme.css";
import type { ReactNode } from "react";

interface HeaderProps {
  actions?: ReactNode;
}

export default function Header({ actions }: HeaderProps) {
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
        <Box>{actions}</Box>
      </Toolbar>
    </AppBar>
  );
}
