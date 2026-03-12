import { useState } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import { Button, CircularProgress } from "@mui/material";

export default function ResumeUpload() {
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);

    setTimeout(() => {
      setFileName(file.name);
      setUploading(false);
      setUploaded(true);
    }, 2000);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);

    /* Later this will call your Spring Boot API */

    setTimeout(() => {
      setAnalyzing(false);
      alert("Resume analysis complete (mock)");
    }, 3000);
  };

  return (
    <>
      <div className="resume-upload-box">
        {!uploaded && !uploading && (
          <>
            <div className="upload-icon-wrapper">
              <CloudUploadIcon fontSize="large" />
            </div>

            <div className="upload-text-title">Drop your resume here</div>

            <div className="upload-text-subtitle">
              or click to browse · PDF or DOCX
            </div>

            <Button variant="outlined" component="label">
              Browse Files
              <input hidden type="file" onChange={handleFileChange} />
            </Button>
          </>
        )}

        {uploading && (
          <>
            <CircularProgress />
            <div>Uploading resume...</div>
          </>
        )}

        {uploaded && (
          <>
            <div className="resume-upload-success-icon">
              <CheckCircleIcon fontSize="large" />
            </div>

            <div className="resume-upload-success-title">Resume uploaded!</div>

            <div className="resume-upload-file">
              <DescriptionIcon />
              {fileName}
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
