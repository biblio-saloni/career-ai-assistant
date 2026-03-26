import { useState } from "react";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import DescriptionIcon from "@mui/icons-material/Description";
import { Button, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ResumeUpload() {
  const navigate = useNavigate();

  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [uploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setUploaded(true);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8080/api/resume/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("Analysis Result:", data);

      navigate("/results", { state: { analysis: data.analysis } });
    } catch (error) {
      console.error("Error analyzing resume:", error);
      alert("Failed to analyze resume. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <div className="resume-upload-box">
        {!uploaded && !uploading && (
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
