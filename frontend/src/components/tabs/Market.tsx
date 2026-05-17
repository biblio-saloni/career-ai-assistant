import type { Analysis } from "../../types/analysis";

interface Props { data: Analysis; }

function AtsGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#f87171";
  const glow  = score >= 80 ? "rgba(34,197,94,0.35)" : score >= 60 ? "rgba(245,158,11,0.35)" : "rgba(248,113,113,0.35)";
  const label = score >= 80 ? "Strong" : score >= 60 ? "Average" : "Weak";
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
      {/* SVG ring */}
      <div style={{ position: "relative", width: "130px", height: "130px", flexShrink: 0 }}>
        <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          {/* Fill */}
          <circle
            cx="65" cy="65" r="52" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s ease", filter: `drop-shadow(0 0 6px ${glow})` }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color }}>{score}</span>
          <span style={{ fontSize: "0.65rem", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>/ 100</span>
        </div>
      </div>

      {/* Info */}
      <div>
        <div style={{ fontSize: "1.2rem", fontWeight: 700, color, marginBottom: "6px" }}>
          {label} ATS Score
        </div>
        <p style={{ margin: 0, fontSize: "0.83rem", color: "#64748b", lineHeight: 1.6, maxWidth: "260px" }}>
          {score >= 80
            ? "Your resume is well-optimised for applicant tracking systems. Keep adding quantified achievements."
            : score >= 60
            ? "Decent score, but adding missing keywords and metrics could push you past most filters."
            : "Your resume may be getting filtered out before a human sees it. Add targeted keywords and restructure."}
        </p>
        <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["Clean formatting", "Keyword density", "Section structure"].map((tip, i) => (
            <span key={i} style={{
              fontSize: "0.7rem", padding: "3px 10px", borderRadius: "20px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8",
            }}>{tip}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Market({ data }: Props) {
  const keywords = data.missing_keywords ?? [];
  // const improvements = data.improvements ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#22d3ee" }}>📊</span> Market Readiness
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
          ATS score, keyword gaps, and what recruiters see when they open your resume.
        </p>
      </div>

      {/* ATS Score Card */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "20px 24px",
      }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
          ATS Score
        </div>
        <AtsGauge score={data.ats_score ?? 0} />
      </div>

      {/* Missing Keywords */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(248,113,113,0.2)",
        borderRadius: "14px",
        padding: "20px 24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Missing Keywords
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#64748b" }}>
              Add these to your resume to pass more ATS filters
            </p>
          </div>
          <span style={{
            fontSize: "0.75rem", padding: "4px 10px", borderRadius: "20px",
            background: "rgba(248,113,113,0.1)", color: "#f87171",
            border: "1px solid rgba(248,113,113,0.25)", fontWeight: 600,
          }}>
            {keywords.length} missing
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {keywords.map((kw: string, i: number) => (
            <span key={i} style={{
              fontSize: "0.8rem", padding: "5px 14px", borderRadius: "20px", fontWeight: 500,
              background: "rgba(248,113,113,0.08)", color: "#fca5a5",
              border: "1px solid rgba(248,113,113,0.2)",
              cursor: "default", transition: "all 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.08)")}
            >
              + {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Actionable Improvements
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(34,211,238,0.15)",
        borderRadius: "14px",
        padding: "20px 24px",
      }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>
          Recruiter Feedback
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {improvements.map((imp, i) => (
            <div key={i} style={{
              display: "flex", gap: "12px", alignItems: "flex-start",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "10px",
            }}>
              <span style={{
                minWidth: "22px", height: "22px",
                background: "rgba(34,211,238,0.15)", color: "#22d3ee",
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "0.7rem", fontWeight: 700,
              }}>{i + 1}</span>
              <p style={{ margin: 0, fontSize: "0.83rem", color: "#cbd5e1", lineHeight: 1.6 }}>{imp}</p>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}