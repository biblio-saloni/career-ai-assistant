import { useState } from "react";
import type { Analysis } from "../../pages/Dashboard";

interface Props {
  data: Analysis;
  extractedText?: string;
}

export function Upskill({ data, extractedText }: Props) {
  const [improving, setImproving] = useState(false);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImprove = async () => {
    console.log("Button clicked");
  console.log("extractedText:", extractedText);
  console.log("data.improvements:", data.improvements);
    if (!extractedText) {
      setError(
        "Original resume text not available. Please re-upload your resume.",
      );
      return;
    }

    setImproving(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/api/resume/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: extractedText,
          improvements: data.improvements,
          missingKeywords: data.missing_keywords,
          skills: data.skills,
          experienceLevel: data.experience_level,
        }),
      });

      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const result = await response.json();
      setImprovedText(result.improvedText);
    } catch (err: any) {
      setError(err.message || "Failed to improve resume.");
    } finally {
      setImproving(false);
    }
  };

  const handleDownload = () => {
    if (!improvedText) return;
    const blob = new Blob([improvedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "improved_resume.txt";
    a.click();
    URL.revokeObjectURL(url);
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
          {!improvedText && !improving && (
            <button className="improve-btn" onClick={handleImprove}>
              ✨ Generate Improved Resume
            </button>
          )}
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
                marginBottom: "12px",
              }}
            >
              <h4 style={{ margin: 0, color: "#22d3ee" }}>
                ✅ Improved Resume Ready
              </h4>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="improve-btn" onClick={handleDownload}>
                  ⬇ Download .txt
                </button>
                <button
                  className="improve-btn improve-btn--secondary"
                  onClick={() => setImprovedText(null)}
                >
                  Regenerate
                </button>
              </div>
            </div>
            <pre className="improved-resume-text">{improvedText}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
