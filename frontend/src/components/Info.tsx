import { Box, Typography } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import EqualizerOutlinedIcon from "@mui/icons-material/EqualizerOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import "../styles/theme.css";

const steps = [
  {
    icon: <FileUploadOutlinedIcon />,
    title: "Upload Resume",
    description:
      "Drop your PDF or DOCX resume and let our AI take it from there.",
  },
  {
    icon: <PsychologyAltIcon />,
    title: "AI Analysis",
    description:
      "We extract skills, experience level, and identify your ideal job roles.",
  },
  {
    icon: <EqualizerOutlinedIcon />,
    title: "Market Matching",
    description:
      "Real job listings are scored against your profile for perfect matches.",
  },
  {
    icon: <RocketLaunchOutlinedIcon />,
    title: "Upskill Path",
    description:
      "Get a personalized roadmap to close skill gaps and land your dream role.",
  },
];

export default function Info() {
  return (
    <Box className="info-container">
      <Typography variant="h4" className="info-title">
        How it works
      </Typography>

      <Typography className="info-subtitle">
        Four simple steps from resume to actionable career insights.
      </Typography>

      <Box className="info-steps-wrapper">
        {steps.map((step, index) => (
          <Box key={index} className="info-step">
            {/* ICON WITH BADGE */}
            <Box className="info-icon-wrapper">
              <span className="info-step-badge">{index + 1}</span>
              {step.icon}
            </Box>

            {/* TEXT */}
            <Typography className="info-step-title">{step.title}</Typography>

            <Typography className="info-step-description">
              {step.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
