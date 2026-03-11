import { Box, Typography, Button, Card, CardContent, Chip } from "@mui/material"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import Info from "../components/Info"
import "../styles/theme.css"

export default function Home() {
  const navigate = useNavigate()

  return (
    <>
      <Box className="home-container">
        <Header />
        <Box className="home-content-wrapper">
          <Box className="home-left-side">
            <Chip label="AI-Powered Career Intelligence" className="home-title-chip"/>
            <Typography variant="h2" className="home-main-title">
              Decode your
            </Typography>
            <Typography variant="h2" className="home-title-accent">
              career trajectory
            </Typography>
            <Typography className="home-description">
              Upload your resume and let AI analyze your skills against real market demand. Discover matching jobs, skill gaps, and a personalized roadmap to your next role.
            </Typography>
            <Button variant="contained" className="home-button" onClick={() => navigate("/upload")}>
              Analyse Your Resume
            </Button>
          </Box>

          <Box className="home-right-side">
            <Card className="home-card">
              <CardContent>
                <Typography className="home-card-title">Job Match Scoring</Typography>
                <Typography className="home-card-description">
                  See how your profile scores against real job listings
                </Typography>
              </CardContent>
            </Card>
            <Card className="home-card">
              <CardContent>
                <Typography className="home-card-title">Skill Gap Analysis</Typography>
                <Typography className="home-card-description">
                  Identify exactly which skills you're missing
                </Typography>
              </CardContent>
            </Card>
            <Card className="home-card">
              <CardContent>
                <Typography className="home-card-title">Market Demand Insights</Typography>
                <Typography className="home-card-description">
                  Know which technologies are trending right now
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
      <Info />
    </>
  )
}