import type { ReactNode } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Avatar,
} from "@mui/material";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/theme.css";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  actions?: ReactNode;
}

export default function Header({ actions }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const getTabValue = (pathname: string): string | false => {
    if (pathname === "/" || pathname === "/home") return "home";
    if (pathname.startsWith("/upload")) return "upload";
    if (pathname.startsWith("/results")) return "dashboard";
    return false;
  };

  const tabValue = getTabValue(location.pathname);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    if (newValue === "home") navigate("/");
    else if (newValue === "upload") navigate("/upload");
    else if (newValue === "dashboard") navigate("/results");
  };

  return (
    <AppBar position="static" className="header-app-bar">
      <Toolbar className="header-toolbar">
        <Box className="header-logo" onClick={() => navigate("/")}>
          <ExploreOutlinedIcon />
          <Typography variant="h6" className="header-title">
            The 6th Sense
          </Typography>
        </Box>

        {/* This Box pushes Tabs (and actions) to the right */}
        <Box
          sx={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            textColor="inherit"
            className="header-tabs"
            aria-label="main navigation"
          >
            <Tab label="Home" value="home" className="header-tab" />
            <Tab label="Upload" value="upload" className="header-tab" />
            <Tab label="Dashboard" value="dashboard" className="header-tab" />
          </Tabs>

          <Box
            sx={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
            className="header-actions"
          >
            {!user ? (
              actions ?? (
                <Button
                  variant="outlined"
                  color="inherit"
                  className="header-button"
                  onClick={() => navigate("/login")}
                >
                  Get Started
                </Button>
              )
            ) : (
              <>
                <Avatar className="header-avatar" sx={{ order: 0 }}>
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Button
                  variant="outlined"
                  color="inherit"
                  className="header-button"
                  onClick={() => signOut()}
                  sx={{ order: 1 }}
                >
                  Sign Out
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
