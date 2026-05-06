import { useState, useEffect } from "react";
import { humanizeError } from "../../utils/errorHelper";
import type { Analysis } from "../../pages/Dashboard";

interface Props {
  data: Analysis;
  onRolesLoaded?: (roles: string[]) => void;
  cachedJobs?: ScoredJob[];
  onJobsCached?: (jobs: ScoredJob[]) => void;
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
      setStage(`🔍 Fetching live listings for: ${primaryRole}...`);

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
      if (onJobsCached) onJobsCached(scored);
      setJobs(scored);
    } catch (err: any) {
      setError(humanizeError(err));
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
