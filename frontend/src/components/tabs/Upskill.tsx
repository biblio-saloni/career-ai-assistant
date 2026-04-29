import { useState } from "react";
import type { Analysis } from "../../pages/Dashboard";

interface Props {
  data: Analysis;
  extractedText?: string;
  originalFile?: File;
}

export function Upskill({ data, extractedText }: Props) {
  const [improving, setImproving] = useState(false);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateImprovedResume = async () => {
    if (!extractedText) {
      setError("Original resume text not available. Please re-upload your resume.");
      return;
    }

    setImproving(true);
    setImprovedText(null);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

      const formData = new FormData();
      formData.append("resumeText", extractedText);
      formData.append("improvements", JSON.stringify(data.improvements || []));
      formData.append("missingKeywords", JSON.stringify(data.missing_keywords || []));
      formData.append("skills", JSON.stringify(data.skills || []));
      formData.append("experienceLevel", data.experience_level || "Mid-Level");

      const response = await fetch(`${apiBase}/api/resume/improve`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server error ${response.status}: ${errText}`);
      }

      const json = await response.json();
      setImprovedText(json.improvedText);
    } catch (err: any) {
      setError(err.message || "Failed to generate improved resume.");
    } finally {
      setImproving(false);
    }
  };

  const handleCopy = async () => {
    if (!improvedText) return;
    await navigator.clipboard.writeText(improvedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          {!improvedText && (
            <button
              className="improve-btn"
              onClick={handleGenerateImprovedResume}
              disabled={improving}
            >
              {improving ? "Generating..." : "✨ Generate Improved Resume"}
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
            style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⏳</div>
            <p style={{ fontWeight: 600, margin: "0 0 4px" }}>
              AI is rewriting your resume...
            </p>
            <p style={{ fontSize: "0.82rem", margin: 0 }}>
              This takes about 15–20 seconds
            </p>
          </div>
        )}
      </div>

      {/* Improved Resume Result */}
      {improvedText && (
        <div className="card" style={{ borderColor: "#22c55e33" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ✅ Improved Resume Ready
              </h3>
              <p
                className="text-muted"
                style={{ fontSize: "0.82rem", margin: "4px 0 0" }}
              >
                Copy and paste this into your resume editor (Word, Google Docs, etc.)
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="improve-btn improve-btn--secondary"
                onClick={handleCopy}
                style={{
                  background: copied ? "#dcfce7" : undefined,
                  borderColor: copied ? "#16a34a" : undefined,
                  color: copied ? "#16a34a" : undefined,
                }}
              >
                {copied ? "✅ Copied!" : "📋 Copy Text"}
              </button>
              <button
                className="improve-btn improve-btn--secondary"
                onClick={() => {
                  setImprovedText(null);
                  setError(null);
                }}
              >
                🔄 Regenerate
              </button>
            </div>
          </div>

          {/* Resume text content */}
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "'Georgia', serif",
              fontSize: "0.88rem",
              lineHeight: "1.7",
              color: "#1f2937",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "20px 24px",
              margin: 0,
              maxHeight: "600px",
              overflowY: "auto",
            }}
          >
            {improvedText}
          </pre>
        </div>
      )}
    </div>
  );
}
