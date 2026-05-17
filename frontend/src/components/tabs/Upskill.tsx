import { useState } from "react";
import type { Analysis } from "../../types/analysisValidator";

interface Props {
  data: Analysis;
  extractedText?: string;
}

function humanizeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong. Please try again.";
}

export function Upskill({ data, extractedText }: Props) {
  const [improving, setImproving] = useState(false);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateImprovedResume = async () => {
    if (!extractedText) {
      setError(
        "Original resume text not available. Please re-upload your resume.",
      );
      return;
    }
    setImproving(true);
    setImprovedText(null);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiBase}/api/resume/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: extractedText,
          improvements: data.improvements || [],
          missingKeywords: data.missing_keywords || [],
          skills: data.skills || [],
          experienceLevel: data.experience_level || "Mid-Level",
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server error ${response.status}: ${errText}`);
      }
      const json = await response.json();
      setImprovedText(json.improvedText);
    } catch (err: unknown) {
      setError(humanizeError(err));
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ color: "#a78bfa" }}>✨</span> Upskill & Improve
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
          AI-powered resume improvements and skill gap roadmap.
        </p>
      </div>

      {/* Top row: Skill Gaps + Missing Keywords */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
      >
        {/* Skill Gaps */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(167,139,250,0.2)",
            borderRadius: "14px",
            padding: "18px",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#7c3aed",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "12px",
            }}
          >
            🔧 Skill Gaps
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.skill_gaps.map(
              (gap: { skill: string; domain: string }, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    background: "rgba(167,139,250,0.05)",
                    border: "1px solid rgba(167,139,250,0.1)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.83rem",
                      color: "#e2e8f0",
                      fontWeight: 500,
                    }}
                  >
                    {gap.skill}
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      background: "rgba(167,139,250,0.12)",
                      color: "#a78bfa",
                      border: "1px solid rgba(167,139,250,0.2)",
                    }}
                  >
                    {gap.domain}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Missing Keywords */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: "14px",
            padding: "18px",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#dc2626",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "12px",
            }}
          >
            🚫 Missing ATS Keywords
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {data.missing_keywords.map((kw: string, i: number) => (
              <span
                key={i}
                style={{
                  fontSize: "0.78rem",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontWeight: 500,
                  background: "rgba(248,113,113,0.08)",
                  color: "#fca5a5",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                + {kw}
              </span>
            ))}
          </div>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "0.76rem",
              color: "#475569",
              lineHeight: 1.5,
            }}
          >
            Add these naturally into your resume to pass ATS filters and reach
            more recruiters.
          </p>
        </div>
      </div>

      {/* Improvements + Generate button */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(34,211,238,0.15)",
          borderRadius: "14px",
          padding: "20px 22px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "#0e7490",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              📝 Resume Improvements
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.78rem",
                color: "#64748b",
              }}
            >
              Apply these to boost your ATS score and readability
            </p>
          </div>
          {!improvedText && (
            <button
              className="improve-btn"
              onClick={handleGenerateImprovedResume}
              disabled={improving}
              style={{ fontSize: "0.82rem" }}
            >
              {improving ? "✨ Generating..." : "✨ Generate Improved Resume"}
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.improvements.map((item: string, i: number) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                padding: "11px 14px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "10px",
              }}
            >
              <span
                style={{
                  minWidth: "22px",
                  height: "22px",
                  flexShrink: 0,
                  background: "rgba(34,211,238,0.12)",
                  color: "#22d3ee",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.83rem",
                  color: "#cbd5e1",
                  lineHeight: 1.6,
                }}
              >
                {item}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
              color: "#fca5a5",
              fontSize: "0.83rem",
            }}
          >
            {error}
          </div>
        )}

        {improving && (
          <div
            style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⏳</div>
            <p style={{ fontWeight: 600, margin: "0 0 4px", color: "#94a3b8" }}>
              AI is rewriting your resume...
            </p>
            <p style={{ fontSize: "0.8rem", margin: 0 }}>About 15–20 seconds</p>
          </div>
        )}
      </div>

      {/* Improved Resume Output */}
      {improvedText && (
        <div
          style={{
            background: "rgba(34,197,94,0.04)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "14px",
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: "#22c55e",
                  fontSize: "0.95rem",
                }}
              >
                ✅ Improved Resume Ready
              </div>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "0.78rem",
                  color: "#64748b",
                }}
              >
                Copy and paste this into Word, Google Docs, or your resume
                editor.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="improve-btn improve-btn--secondary"
                onClick={handleCopy}
                style={{
                  background: copied ? "rgba(34,197,94,0.15)" : undefined,
                  color: copied ? "#22c55e" : undefined,
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
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "'Georgia', serif",
              fontSize: "0.85rem",
              lineHeight: "1.75",
              color: "#1e293b",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
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
