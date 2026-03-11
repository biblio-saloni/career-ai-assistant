import { Box, Typography, Card, CardContent } from "@mui/material"
import "../styles/theme.css"

const steps = [
  { title: "Upload Resume", description: "Drop your PDF or DOCX resume and let our AI take it from there." },
  { title: "AI Analysis", description: "We extract skills, experience level, and identify your ideal job roles." },
  { title: "Market Matching", description: "Real job listings are scored against your profile for perfect matches." },
  { title: "Upskill Path", description: "Get a personalized roadmap to close skill gaps and land your dream role." }
]

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
          <Card key={index} className="info-step-card">
            <CardContent>
              <Typography className="info-step-number">{index + 1}</Typography>
              <Typography className="info-step-title">{step.title}</Typography>
              <Typography className="info-step-description">{step.description}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}