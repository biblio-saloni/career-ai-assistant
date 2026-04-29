import { useState, useEffect } from "react";
import type { Analysis } from "../../pages/Dashboard";

interface Props {
  data: Analysis;
  onRolesLoaded?: (roles: string[]) => void;
}

interface ScoredJob {
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

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const RAPID_API_KEY = import.meta.env.VITE_RAPID_API_KEY || "";

export function Jobs({ data, onRolesLoaded }: Props) {
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<string>("🔍 Searching live job listings...");
  const [error, setError] = useState<string | null>(null);
  const [openMsg, setOpenMsg] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  // Build a search query from the user's actual resume skills — top 3 skills + "developer India"
  const topSkills = data.skills.slice(0, 3).join(" ");
  const roleQuery = `${topSkills} developer India`;
  const skillsList = data.skills.join(", ");
  const expLevel = data.experience_level;

  const fetchJobs = async () => {
    setLoading(true);
    setJobs([]);
    setError(null);

    if (!RAPID_API_KEY) {
      setError("RapidAPI key missing. Add VITE_RAPID_API_KEY to your .env file.");
      setLoading(false);
      return;
    }

    if (!GROQ_API_KEY) {
      setError("Groq API key missing. Add VITE_GROQ_API_KEY to your .env file.");
      setLoading(false);
      return;
    }

    try {
      // ── STEP 1: Fetch real jobs from JSearch using resume skills ──
      setStage(`🔍 Fetching live listings for: ${topSkills}...`);

      const jsRes = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(roleQuery)}&num_pages=2&date_posted=month&employment_types=FULLTIME`,
        {
          headers: {
            "X-RapidAPI-Key": RAPID_API_KEY,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
          },
        }
      );

      if (!jsRes.ok) {
        const errData = await jsRes.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            `JSearch error ${jsRes.status}. Check your VITE_RAPID_API_KEY.`
        );
      }

      const jsData = await jsRes.json();
      const rawJobs = (jsData.data || []) as any[];
      if (rawJobs.length === 0)
        throw new Error("No live jobs found. Try again later.");

      // ── STEP 2: AI scoring via Groq ──
      setStage(`🤖 Found ${rawJobs.length} listings. AI scoring matches...`);

      const summaries = rawJobs
        .map((j: any, i: number) => {
          const loc =
            [j.job_city, j.job_state, j.job_country]
              .filter(Boolean)
              .join(", ") || "India";
          const desc = (j.job_description || "")
            .replace(/\s+/g, " ")
            .slice(0, 300);
          return `[${i}] "${j.job_title}" at ${j.employer_name} (${loc}) — ${desc}`;
        })
        .join("\n\n");

      const groqRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            max_tokens: 4000,
            temperature: 0.2,
            messages: [
              {
                role: "system",
                content: `You are a brutally honest job-fit evaluator. Score ALL provided jobs using this strict weighted formula:

SCORING (compute "match" as weighted average):

1. SKILL OVERLAP (50%):
   - Candidate skills: ${skillsList}
   - skill_score = (matched_required_skills / total_required_skills) * 100
   - Only 1–2 skill matches out of 8+ required → skill_score ≤ 30

2. EXPERIENCE FIT (35%):
   - Candidate level: ${expLevel}
   - Fresher/Junior (0–2 yrs): 0–3 yrs req → 100, 4–5 yrs → 50, 6+ → 10
   - Mid-Level (2–4 yrs): 0–4 yrs req → 100, 5–6 yrs → 50, 7+ → 10
   - Senior (4+ yrs): 0–6 yrs req → 100, 7+ → 70

3. ROLE ALIGNMENT (15%):
   - Exact match (same tech domain) → 100
   - Partial (adjacent domain) → 60
   - Mismatch (completely different stack) → 10

FINAL match = round(skill_score*0.5 + exp_score*0.35 + role_score*0.15)

RULES:
- Never inflate. A poor match should score 30–55, not 80+.
- difficulty: "easy" if match ≥ 75; "medium" if 55–74; "hard" if < 55
- type: "product" if known product company; else "service"
- skills: exactly 3 skills the candidate actually has that this job needs
- insight: ONE honest sentence about fit AND gaps
- Return ALL ${rawJobs.length} jobs sorted by match score descending.
- Return ONLY a raw JSON array — no markdown, no explanation.

JSON shape per object: { index, title, company, location, type, match, skills, difficulty, insight, recruiterTip }`,
              },
              {
                role: "user",
                content: `Score ALL ${rawJobs.length} jobs for this candidate and return exactly ${rawJobs.length} objects sorted by match:\n\n${summaries}`,
              },
            ],
          }),
        }
      );

      const groqData = await groqRes.json();
      if (groqData.error) throw new Error("Groq: " + groqData.error.message);

      const text = groqData.choices[0].message.content;
      const s = text.indexOf("[");
      const e = text.lastIndexOf("]");
      if (s === -1 || e === -1) throw new Error("AI response parsing failed — try refreshing.");

      const scored: ScoredJob[] = JSON.parse(text.slice(s, e + 1)).map(
        (item: any) => ({
          ...item,
          applyUrl:
            rawJobs[item.index]?.job_apply_link ||
            rawJobs[item.index]?.job_google_link ||
            "",
        })
      );

      // Clean and deduplicate job titles for sidebar
      // Strip trailing codes like "IRC289227", long suffixes, and keep the core role title
      const cleanedTitles = Array.from(
        new Set(
          scored.map((j: ScoredJob) =>
            j.title
              .replace(/\s*[-–|].*$/, "")          // strip "- ReactJS, Redux..." suffixes
              .replace(/\s*\((?!react|vue|node)[^)]+\)/gi, "") // strip "(NestJS)" but keep "(React)"
              .replace(/\s+IRC\d+$/i, "")           // strip trailing job codes like IRC289227
              .replace(/\s+[A-Z]{2,}\d+$/i, "")    // strip other code patterns
              .trim()
          )
        )
      ).filter(Boolean);

      if (onRolesLoaded) onRolesLoaded(cleanedTitles);
      setJobs(scored);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try refreshing.");
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const highMatch = jobs.filter((j) => j.match >= 70).length;
  const productCos = jobs.filter((j) => j.type === "product").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>
            Live Job Matches
          </h3>
          <p className="text-muted" style={{ fontSize: "0.82rem", marginTop: "4px" }}>
            Real listings scored against your resume skills:{" "}
            <strong>{data.skills.slice(0, 3).join(", ")}</strong>
          </p>
        </div>
        {!loading && (
          <button
            className="improve-btn improve-btn--secondary"
            onClick={fetchJobs}
            style={{ whiteSpace: "nowrap", fontSize: "0.8rem", padding: "7px 14px" }}
          >
            🔄 Refresh
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "48px 16px",
            color: "#6b7280",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>
            {stage.startsWith("🔍") ? "🔍" : "🤖"}
          </div>
          <p style={{ fontWeight: 600, margin: "0 0 4px" }}>{stage}</p>
          <p style={{ fontSize: "0.8rem", margin: 0 }}>
            Fetching from LinkedIn & Indeed, then scoring with AI...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: "8px",
            padding: "12px 16px",
            color: "#f87171",
            fontSize: "0.85rem",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>⚠️ {error}</p>
          <button
            className="improve-btn improve-btn--secondary"
            onClick={fetchJobs}
            style={{ fontSize: "0.78rem", padding: "5px 12px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      {!loading && jobs.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          {[
            { label: "Roles Found", value: jobs.length },
            { label: "High Match (≥70%)", value: highMatch },
            { label: "Product Cos", value: productCos },
          ].map((s) => (
            <div
              key={s.label}
              className="card"
              style={{ textAlign: "center", padding: "12px" }}
            >
              <div
                style={{ fontSize: "1.8rem", fontWeight: 700, color: "#6366f1" }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginTop: "2px",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job cards */}
      {!loading &&
        jobs.map((job, i) => {
          const barColor =
            job.match >= 70
              ? "#6366f1"
              : job.match >= 55
              ? "#f59e0b"
              : "#f87171";
          const diffStyle =
            job.difficulty === "easy"
              ? { bg: "rgba(34,197,94,0.1)", text: "#16a34a", border: "rgba(34,197,94,0.2)" }
              : job.difficulty === "medium"
              ? { bg: "rgba(245,158,11,0.1)", text: "#b45309", border: "rgba(245,158,11,0.2)" }
              : { bg: "rgba(248,113,113,0.1)", text: "#dc2626", border: "rgba(248,113,113,0.2)" };

          return (
            <div
              key={i}
              className="card"
              style={{ borderLeft: `3px solid ${barColor}` }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    {job.title}
                  </div>
                  <div
                    className="text-muted"
                    style={{ fontSize: "0.82rem", marginTop: "2px" }}
                  >
                    {job.company} · {job.location}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 10px",
                      borderRadius: "20px",
                      fontWeight: 500,
                      background: diffStyle.bg,
                      color: diffStyle.text,
                      border: `1px solid ${diffStyle.border}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {job.difficulty}
                  </span>
                  {job.type === "product" && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 10px",
                        borderRadius: "20px",
                        fontWeight: 500,
                        background: "rgba(99,102,241,0.1)",
                        color: "#6366f1",
                        border: "1px solid rgba(99,102,241,0.2)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      product
                    </span>
                  )}
                </div>
              </div>

              {/* Matched skills */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                {(job.skills || []).map((sk, j) => (
                  <span key={j} className="badge badge-green">
                    {sk}
                  </span>
                ))}
              </div>

              {/* Match bar */}
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    color: "#6b7280",
                    marginBottom: "5px",
                  }}
                >
                  <span>Profile match</span>
                  <span style={{ fontWeight: 600, color: barColor }}>{job.match}%</span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: "#f3f4f6",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${job.match}%`,
                      background: barColor,
                      borderRadius: "2px",
                      transition: "width 1s ease",
                    }}
                  />
                </div>
              </div>

              {/* Insight */}
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  fontStyle: "italic",
                  borderLeft: "2px solid #e5e7eb",
                  paddingLeft: "10px",
                  margin: "0 0 12px",
                }}
              >
                {job.insight}
              </p>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {job.applyUrl ? (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="improve-btn"
                    style={{ textDecoration: "none", fontSize: "0.8rem", padding: "7px 14px" }}
                  >
                    Apply →
                  </a>
                ) : (
                  <a
                    href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + " " + job.company)}&location=India`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="improve-btn improve-btn--secondary"
                    style={{ textDecoration: "none", fontSize: "0.8rem", padding: "7px 14px" }}
                  >
                    Search on LinkedIn →
                  </a>
                )}
                <button
                  className="improve-btn improve-btn--secondary"
                  style={{ fontSize: "0.8rem", padding: "7px 14px" }}
                  onClick={() => setOpenMsg(openMsg === i ? null : i)}
                >
                  💬 Recruiter message
                </button>
              </div>

              {/* Recruiter message box */}
              {openMsg === i && (
                <div
                  style={{
                    marginTop: "12px",
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "12px 14px 12px 14px",
                    fontSize: "0.82rem",
                    lineHeight: 1.7,
                    color: "#374151",
                    position: "relative",
                  }}
                >
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Hi [recruiter name], I just applied for the ${job.title} role at ${job.company}. I have ${expLevel}-level experience in ${data.skills.slice(0, 3).join(", ")} and have built production-scale applications. Would love to be considered — happy to share more details!`
                      );
                      setCopied(i);
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: copied === i ? "#dcfce7" : "#f3f4f6",
                      border: "1px solid #e5e7eb",
                      color: copied === i ? "#16a34a" : "#6b7280",
                      fontSize: "0.7rem",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    {copied === i ? "✅ Copied" : "Copy"}
                  </button>
                  Hi [recruiter name], I just applied for the {job.title} role at {job.company}. I have {expLevel}-level experience in {data.skills.slice(0, 3).join(", ")} and have built production-scale applications. Would love to be considered — happy to share more details!
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: "8px",
                    }}
                  >
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