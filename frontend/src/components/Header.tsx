import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
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

        {/* 👇 Logo Section */}
        <Box
          className="header-logo"
          onClick={() => navigate("/")}
        >
          <ExploreOutlinedIcon />
          <Typography variant="h6" className="header-title">
            The 6th Sense
          </Typography>
        </Box>

        <Box>{actions}</Box>
      </Toolbar>
    </AppBar>
  );
}