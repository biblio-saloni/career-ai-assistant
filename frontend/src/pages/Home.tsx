import { Box, Typography, Button, Card, CardContent } from "@mui/material"
import Grid from "@mui/material/Grid"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header"

export default function Home() {
  const navigate = useNavigate()

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#0f172a)", color: "white" }}>

      <Header />

      <Grid container spacing={6} sx={{ padding: "80px 120px" }}>

        {/* LEFT SIDE */}
        <Grid item xs={12} md={6}>
          <Typography variant="overline" sx={{ color: "#22d3ee" }}>
            AI-Powered Career Intelligence
          </Typography>

          <Typography variant="h2" sx={{ fontWeight: 800, marginTop: 2 }}>
            Decode your
          </Typography>

          <Typography variant="h2" sx={{ fontWeight: 800, color: "#22d3ee" }}>
            career trajectory
          </Typography>

          <Typography sx={{ marginTop: 3, color: "#cbd5f5" }}>
            Upload your resume and let AI analyze your skills against real
            market demand. Discover matching jobs, skill gaps, and a
            personalized roadmap to your next role.
          </Typography>

          <Button
            variant="contained"
            sx={{
              marginTop: 4,
              background: "#22d3ee",
              color: "#020617",
              fontWeight: 600,
              padding: "12px 24px"
            }}
            onClick={() => navigate("/upload")}
          >
            Upload Your Resume
          </Button>
        </Grid>

        {/* RIGHT SIDE CARDS */}
        <Grid item xs={12} md={6}>

          <Card sx={{ background: "#0f172a", marginBottom: 3 }}>
            <CardContent>
              <Typography variant="h6">Job Match Scoring</Typography>
              <Typography variant="body2">
                See how your profile scores against real job listings
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ background: "#0f172a", marginBottom: 3 }}>
            <CardContent>
              <Typography variant="h6">Skill Gap Analysis</Typography>
              <Typography variant="body2">
                Identify exactly which skills you're missing
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ background: "#0f172a" }}>
            <CardContent>
              <Typography variant="h6">Market Demand Insights</Typography>
              <Typography variant="body2">
                Know which technologies are trending right now
              </Typography>
            </CardContent>
          </Card>

        </Grid>

      </Grid>

    </Box>
  )
}