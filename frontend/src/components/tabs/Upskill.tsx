import { useState } from "react";
import type { Analysis } from "../../pages/Dashboard";

interface Props {
  data: Analysis;
  extractedText?: string;
  originalFile?: File;
}

export function Upskill({ data, extractedText, originalFile }: Props) {
  const [improving, setImproving] = useState(false);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadImprovedResume = async () => {
    if (!extractedText || !originalFile) {
      setError("Original resume file not available.");
      return;
    }

    setImproving(true);
    setImprovedText(null);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8080";

      const formData = new FormData();
      formData.append("file", originalFile);
      formData.append("resumeText", extractedText);
      formData.append("improvements", JSON.stringify(data.improvements || []));
      formData.append("missingKeywords", JSON.stringify(data.missing_keywords || []));
      formData.append("skills", JSON.stringify(data.skills || []));
      formData.append("experienceLevel", data.experience_level || "Mid-Level");

      const response = await fetch(`${apiBase}/api/resume/improve`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`Server error ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `improved-resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setImprovedText("downloaded");
    } catch (err: any) {
      setError(err.message || "Failed to download improved resume.");
    } finally {
      setImproving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top row — Skill Gaps + Missing Keywords */}
      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Skill Gaps</h3>
          <div className="upskill-item-list">
            {data.skill_gaps.map((gap, i) => (
              <div key={i} className="upskill-item">
                <p style={{ fontWeight: 500, margin: 0 }}>{gap.skill}</p>
                <p className="text-muted" style={{ margin: 0 }}>
                  {gap.domain}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Missing ATS Keywords</h3>
          <p
            className="text-muted"
            style={{ fontSize: "0.82rem", marginBottom: "12px" }}
          >
            Add these to your resume to improve ATS ranking
          </p>
          <div className="skill-chip-grid">
            {data.missing_keywords.map((kw, i) => (
              <span key={i} className="badge badge-red">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Resume Improvements + Generate */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              Resume Improvements
            </h3>
            <p
              className="text-muted"
              style={{ fontSize: "0.82rem", marginTop: "4px" }}
            >
              Apply these to boost your ATS score
            </p>
          </div>
          <button
            className="improve-btn"
            onClick={handleDownloadImprovedResume}
            disabled={improving}
          >
            {improving ? "Generating..." : "📥 Download Improved Resume"}
          </button>
        </div>

        {/* Improvements list */}
        <div className="section-list">
          {data.improvements.map((item, i) => (
            <div key={i} className="improvement-item">
              <span className="improvement-number">{i + 1}</span>
              <p style={{ margin: 0 }}>{item}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p
            style={{
              color: "#f87171",
              marginTop: "12px",
              fontSize: "0.85rem",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: "6px",
              padding: "8px 12px",
            }}
          >
            {error}
          </p>
        )}

        {/* Loading state */}
        {improving && (
          <div
            style={{ textAlign: "center", padding: "24px", color: "#6b7280" }}
          >
            <p style={{ fontWeight: 500 }}>Rewriting your resume with AI...</p>
            <p style={{ fontSize: "0.82rem" }}>
              This takes about 15–20 seconds
            </p>
          </div>
        )}

        {/* Result */}
        {improvedText && (
          <div className="improved-resume-box">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h4 style={{ margin: 0, color: "#16a34a" }}>
                {improvedText.includes("downloaded")
                  ? "✅ PDF Downloaded!"
                  : "✅ Improved Resume Ready"}
              </h4>
              <button
                className="improve-btn improve-btn--secondary"
                onClick={() => setImprovedText(null)}
              >
                Regenerate
              </button>
            </div>
            {!improvedText.includes("downloaded") && (
              <pre className="improved-resume-text">{improvedText}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
