import { useState } from "react";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import DescriptionIcon from "@mui/icons-material/Description";
import { Button, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setUploaded(true);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    if (!user?.id) {
      setError("You must be logged in to analyze a resume.");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      formData.append("fileName", file.name);

      const apiUrl = import.meta.env.VITE_API_BASE || "http://localhost:8080";

      const response = await fetch(`${apiUrl}/api/resume/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error ${response.status}: ${text}`);
      }

      const data = await response.json();
      navigate("/results", {
        state: { analysis: data.analysis, extractedText: data.extractedText },
      });
    } catch (err: any) {
      if (err.message?.includes("Failed to fetch")) {
        setError(
          "Cannot reach the server. Make sure your backend is running on port 8080.",
        );
      } else {
        setError(err.message || "Failed to analyze resume. Please try again.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <div className="resume-upload-box">
        {!uploaded && (
          <>
            <div className="upload-icon-wrapper">
              <FileDownloadOutlinedIcon fontSize="large" />
            </div>
            <div className="upload-text-title">Drop your resume here</div>
            <div className="upload-text-subtitle">
              or click to browse · PDF or DOCX
            </div>
            <Button
              variant="outlined"
              component="label"
              sx={{
                textTransform: "none",
                color: "black",
                border: "1px solid gray",
              }}
            >
              Browse Files
              <input
                hidden
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
              />
            </Button>
          </>
        )}

        {uploaded && (
          <>
            <div className="resume-upload-success-icon">
              <TaskAltIcon fontSize="large" />
            </div>
            <div className="resume-upload-success-title">Resume uploaded!</div>
            <div className="resume-upload-file">
              <DescriptionIcon />
              {fileName}
              <span
                className="file-change-link"
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                Change
              </span>
              <input
                id="fileInput"
                hidden
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
            </div>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          style={{
            color: "#f87171",
            textAlign: "center",
            marginTop: "12px",
            fontSize: "0.9rem",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: "8px",
            padding: "10px 16px",
          }}
        >
          {error}
        </p>
      )}

      {uploaded && !analyzing && (
        <button className="analyze-button" onClick={handleAnalyze}>
          Analyze My Resume →
        </button>
      )}

      {analyzing && (
        <div className="resume-loader-container">
          <CircularProgress />
          <h3>Analyzing your resume...</h3>
          <p>Extracting skills, finding jobs, and building your roadmap.</p>
          <div className="loader-step">
            <div className="loader-dot" />
            Parsing resume & extracting skills
          </div>
          <div className="loader-step">
            <div className="loader-dot" />
            Searching job market for matches
          </div>
          <div className="loader-step">
            <div className="loader-dot" />
            Building upskill recommendations
          </div>
        </div>
      )}
    </>
  );
}
