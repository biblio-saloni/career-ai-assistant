import LinkedInIcon from "@mui/icons-material/LinkedIn";
import CodeIcon from "@mui/icons-material/Code";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import { Box, Typography } from "@mui/material";

export function SocialSection() {
  return (
    <div className="social-section">
      <div className="social-container">

        {/* Logo */}
        <Box className="social-logo">
          <ExploreOutlinedIcon />
          <Typography className="social-title">
            The 6th Sense
          </Typography>
        </Box>

        {/* Tagline */}
        <Typography className="social-tagline">
          Your one-stop AI-powered career companion — guiding you from skills to success.
        </Typography>

        {/* Icons */}
        <div className="social-icons">
          <a
            href="https://www.linkedin.com/in/tanisha-kar/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            <LinkedInIcon className="social-icon" />
          </a>

          <a
            href="https://leetcode.com/u/tanishakar4787/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            <CodeIcon className="social-icon" />
          </a>
        </div>

      </div>
    </div>
  );
}