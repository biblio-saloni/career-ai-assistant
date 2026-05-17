import { useState, useEffect } from "react";
import { humanizeError } from "../../utils/errorHelper";
import type { Analysis } from "../../types/analysis";

interface Props {
  data: Analysis;
  onRolesLoaded?: (roles: string[]) => void;
  cachedJobs?: ScoredJob[];
  onJobsCached?: (jobs: ScoredJob[]) => void;
}

export interface ScoredJob {
  index: number;
  title: string;
  company: string;
  location: string;
  type: "product" | "service";
  match: number;
  skills: string[];
  difficulty: "easy" | "medium" | "hard";
  insight: string;
  recruiterTip: string;
  applyUrl: string;
}

export function Jobs({ data, onRolesLoaded, cachedJobs, onJobsCached }: Props) {
  const [jobs, setJobs] = useState<ScoredJob[]>(cachedJobs ?? []);
  const [loading, setLoading] = useState((cachedJobs ?? []).length === 0);
  const [stage, setStage] = useState<string>((cachedJobs ?? []).length === 0 ? "🔍 Searching live job listings..." : "");
  const [error, setError] = useState<string | null>(null);
  const [openMsg, setOpenMsg] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  // Restore roles if returning to tab with cached jobs
  useEffect(() => {
    if (cachedJobs && cachedJobs.length > 0 && onRolesLoaded) {
      const titles = Array.from(new Set(cachedJobs.map(j =>
        j.title.replace(/\s*[-–|].*$/, "").replace(/\s+IRC\d+$/i, "").trim()
      ))).filter(Boolean);
      onRolesLoaded(titles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build a search query from the user's actual resume skills — top 3 skills + "developer India"
  // Use recommended_roles as search terms — much better job search signal than raw skills
  // e.g. "SAP UI5 Developer" or "Frontend Developer" → searches exactly what's on job boards
  const primaryRole = data.recommended_roles[0] ?? data.skills.slice(0, 2).join(" ") + " developer";
  const roleQuery = `${primaryRole} India`;
  const skillsList = data.skills.join(", ");
  const expLevel = data.experience_level;

  const fetchJobs = async () => {
    setLoading(true);
    setJobs([]);
    setError(null);

    try {
      setStage(`🔍 Searching live listings for: ${primaryRole}...`);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      
      setStage(`🤖 Scoring matches...`);

      const response = await fetch(
        `${apiUrl}/api/jobs/score?roleQuery=${encodeURIComponent(roleQuery)}&skills=${encodeURIComponent(skillsList)}&expLevel=${encodeURIComponent(expLevel)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as { details?: string }).details ||
            (errData as { error?: string }).error ||
            `Server error ${response.status}`
        );
      }

      const data = await response.json();
      const scored: ScoredJob[] = data.jobs || [];

      if (scored.length === 0) {
        throw new Error("No jobs found. Try adjusting your search criteria.");
      }

      // Clean and deduplicate job titles for sidebar
      const cleanedTitles = Array.from(
        new Set(
          scored.map((j: ScoredJob) =>
            j.title
              .replace(/\s*[-–|].*$/, "")
              .replace(/\s*\((?!react|vue|node)[^)]+\)/gi, "")
              .replace(/\s+IRC\d+$/i, "")
              .replace(/\s+[A-Z]{2,}\d+$/i, "")
              .trim()
          )
        )
      ).filter(Boolean);

      if (onRolesLoaded) onRolesLoaded(cleanedTitles);
      if (onJobsCached) onJobsCached(scored);
      setJobs(scored);
    } catch (err: unknown) {
      setError(humanizeError(err as Error));
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  // Auto-fetch only if no cached results
  useEffect(() => {
    if (!cachedJobs || cachedJobs.length === 0) {
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const highMatch = jobs.filter((j) => j.match >= 70).length;
  const productCos = jobs.filter((j) => j.type === "product").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#22d3ee" }}>💼</span> Live Job Matches
          </h3>
          <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
            Real listings scored against your profile:{" "}
            <span style={{ color: "#22d3ee", fontWeight: 500 }}>{data.recommended_roles[0] ?? data.skills.slice(0, 2).join(", ")}</span>
          </p>
        </div>
        {!loading && (
          <button
            className="improve-btn improve-btn--secondary"
            onClick={fetchJobs}
            style={{ whiteSpace: "nowrap", fontSize: "0.78rem", padding: "7px 14px" }}
          >
            🔄 Refresh
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(34,211,238,0.15)",
          borderRadius: "14px", padding: "48px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "14px", animation: "pulse 2s infinite" }}>
            {stage.startsWith("🔍") ? "🔍" : "🤖"}
          </div>
          <p style={{ fontWeight: 600, margin: "0 0 6px", color: "#f1f5f9", fontSize: "0.95rem" }}>{stage}</p>
          <p style={{ fontSize: "0.8rem", margin: 0, color: "#475569" }}>
            Searching live listings, then scoring each role with AI…
          </p>
          {/* Pulse dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "20px" }}>
            {[0, 1, 2].map(d => (
              <div key={d} style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#22d3ee", opacity: 0.6,
                animation: `pulse ${1 + d * 0.3}s ease-in-out infinite alternate`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{
          background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: "12px", padding: "16px 18px",
        }}>
          <p style={{ margin: "0 0 10px", fontWeight: 600, color: "#fca5a5", fontSize: "0.88rem" }}>⚠️ {error}</p>
          <button className="improve-btn improve-btn--secondary" onClick={fetchJobs} style={{ fontSize: "0.78rem" }}>
            Retry
          </button>
        </div>
      )}

      {/* Stats strip */}
      {!loading && jobs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          {[
            { label: "Roles Found", value: jobs.length, color: "#22d3ee" },
            { label: "High Match (≥70%)", value: highMatch, color: "#22c55e" },
            { label: "Product Companies", value: productCos, color: "#a78bfa" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "12px", padding: "14px", textAlign: "center",
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.68rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "3px" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job cards */}
      {!loading && jobs.map((job, i) => {
        const barColor = job.match >= 70 ? "#22c55e" : job.match >= 55 ? "#f59e0b" : "#f87171";
        const barGlow  = job.match >= 70 ? "rgba(34,197,94,0.4)" : job.match >= 55 ? "rgba(245,158,11,0.4)" : "rgba(248,113,113,0.4)";
        const diffStyle = job.difficulty === "easy"
          ? { bg: "rgba(34,197,94,0.1)", text: "#22c55e", border: "rgba(34,197,94,0.25)" }
          : job.difficulty === "medium"
          ? { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", border: "rgba(245,158,11,0.25)" }
          : { bg: "rgba(248,113,113,0.1)", text: "#f87171", border: "rgba(248,113,113,0.25)" };

        return (
          <div key={i} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderLeft: `3px solid ${barColor}`,
            borderRadius: "14px", padding: "18px 20px",
            transition: "all 0.2s ease",
            position: "relative", overflow: "hidden",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLDivElement).style.borderColor = `${barColor}55`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
            }}
          >
            {/* Subtle top glow based on match */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "1px",
              background: `linear-gradient(90deg, transparent, ${barColor}44, transparent)`,
            }} />

            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.97rem", color: "#f1f5f9" }}>{job.title}</div>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "3px" }}>
                  {job.company} · {job.location}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span style={{
                  fontSize: "0.7rem", padding: "3px 10px", borderRadius: "20px", fontWeight: 500,
                  background: diffStyle.bg, color: diffStyle.text, border: `1px solid ${diffStyle.border}`,
                  whiteSpace: "nowrap",
                }}>{job.difficulty}</span>
                {job.type === "product" && (
                  <span style={{
                    fontSize: "0.7rem", padding: "3px 10px", borderRadius: "20px", fontWeight: 500,
                    background: "rgba(167,139,250,0.1)", color: "#a78bfa",
                    border: "1px solid rgba(167,139,250,0.25)", whiteSpace: "nowrap",
                  }}>product</span>
                )}
              </div>
            </div>

            {/* Matched skills */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
              {(job.skills || []).map((sk, j) => (
                <span key={j} style={{
                  fontSize: "0.72rem", padding: "3px 10px", borderRadius: "20px", fontWeight: 500,
                  background: "rgba(34,197,94,0.08)", color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}>{sk}</span>
              ))}
            </div>

            {/* Match bar */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "#475569", marginBottom: "6px" }}>
                <span>Profile match</span>
                <span style={{ fontWeight: 700, color: barColor }}>{job.match}%</span>
              </div>
              <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${job.match}%`,
                  background: `linear-gradient(90deg, ${barColor}, ${barColor}bb)`,
                  borderRadius: "3px", transition: "width 1.2s ease",
                  boxShadow: `0 0 8px ${barGlow}`,
                }} />
              </div>
            </div>

            {/* Insight */}
            <p style={{
              fontSize: "0.8rem", color: "#64748b", fontStyle: "italic",
              borderLeft: `2px solid ${barColor}44`, paddingLeft: "10px", margin: "0 0 14px",
              lineHeight: 1.6,
            }}>{job.insight}</p>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {job.applyUrl ? (
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                  className="improve-btn"
                  style={{ textDecoration: "none", fontSize: "0.78rem", padding: "7px 14px" }}
                >Apply →</a>
              ) : (
                <a
                  href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + " " + job.company)}&location=India`}
                  target="_blank" rel="noopener noreferrer"
                  className="improve-btn improve-btn--secondary"
                  style={{ textDecoration: "none", fontSize: "0.78rem", padding: "7px 14px" }}
                >Search on LinkedIn →</a>
              )}
              <button
                className="improve-btn improve-btn--secondary"
                style={{ fontSize: "0.78rem", padding: "7px 14px" }}
                onClick={() => setOpenMsg(openMsg === i ? null : i)}
              >💬 Recruiter message</button>
            </div>

            {/* Recruiter message box */}
            {openMsg === i && (
              <div style={{
                marginTop: "14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(34,211,238,0.15)",
                borderRadius: "10px", padding: "14px 16px",
                fontSize: "0.83rem", lineHeight: 1.7, color: "#cbd5e1",
                position: "relative",
              }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Hi [recruiter name], I just applied for the ${job.title} role at ${job.company}. I have ${expLevel}-level experience in ${data.skills.slice(0, 3).join(", ")} and have built production-scale applications. Would love to be considered — happy to share more details!`
                    );
                    setCopied(i);
                    setTimeout(() => setCopied(null), 2000);
                  }}
                  style={{
                    position: "absolute", top: "10px", right: "10px",
                    background: copied === i ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: copied === i ? "#22c55e" : "#94a3b8",
                    fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", cursor: "pointer",
                  }}
                >{copied === i ? "✅ Copied" : "Copy"}</button>
                Hi [recruiter name], I just applied for the {job.title} role at {job.company}. I have {expLevel}-level experience in {data.skills.slice(0, 3).join(", ")} and have built production-scale applications. Would love to be considered — happy to share more details!
                <div style={{ marginTop: "8px", fontSize: "0.74rem", color: "#475569", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                  💡 {job.recruiterTip}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
