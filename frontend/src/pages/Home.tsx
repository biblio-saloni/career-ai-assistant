import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import ElectricBoltRoundedIcon from "@mui/icons-material/ElectricBoltRounded";
import MovingOutlinedIcon from "@mui/icons-material/MovingOutlined";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Info from "../components/Info";
import "../styles/theme.css";
import { SocialSection } from "../components/SocialSection";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAnalyse = () => {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/upload");
    }
  };

  return (
    <>
      <Box className="home-container">
        <Header />
        <Box className="home-content-wrapper">
          <Box className="home-left-side">
            <Chip
              label="AI-Powered Career Intelligence"
              className="home-title-chip"
            />
            <Typography variant="h1" className="home-main-title">
              Decode your
            </Typography>
            <Typography variant="h2" className="home-title-accent">
              career trajectory
            </Typography>
            <Typography className="home-description">
              Upload your resume and let AI analyze your skills against real
              market demand. Discover matching jobs, skill gaps, and a
              personalized roadmap to your next role.
            </Typography>
            <Button
              variant="contained"
              className="home-button"
              endIcon={<ArrowForwardIcon />}
              onClick={handleAnalyse}
            >
              Analyse Your Resume
            </Button>
          </Box>

          <Box className="home-right-side">
            <Card className="home-card">
              <CardContent>
                <div className="home-card-icon">
                  <TrackChangesOutlinedIcon />
                </div>
                <div>
                  <Typography className="home-card-title">
                    Job Match Scoring
                  </Typography>
                  <Typography className="home-card-description">
                    See how your profile scores against real job listings
                  </Typography>
                </div>
              </CardContent>
            </Card>
            <Card className="home-card">
              <CardContent>
                <div className="home-card-icon">
                  <ElectricBoltRoundedIcon />
                </div>
                <div>
                  <Typography className="home-card-title">
                    Skill Gap Analysis
                  </Typography>
                  <Typography className="home-card-description">
                    Identify exactly which skills you're missing
                  </Typography>
                </div>
              </CardContent>
            </Card>
            <Card className="home-card">
              <CardContent>
                <div className="home-card-icon">
                  <MovingOutlinedIcon />
                </div>
                <div>
                  <Typography className="home-card-title">
                    Market Demand Insights
                  </Typography>
                  <Typography className="home-card-description">
                    Know which technologies are trending right now
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
      <Info />
      <SocialSection />
    </>
  );
}
