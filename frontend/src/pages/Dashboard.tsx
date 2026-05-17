import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Jobs, type ScoredJob } from "../components/tabs/Jobs";
import { SkillGaps } from "../components/tabs/SkillGaps";
import { Market } from "../components/tabs/Market";
import { Upskill } from "../components/tabs/Upskill";
import { supabase } from "../lib/supabaseClient";
import { validateAnalysis, type Analysis } from "../types/analysisValidator";

interface ScanRecord {
  id: string;
  file_name: string;
  created_at: string;
  skills: string[];
  recommended_roles: string[];
  experience_level: string;
  skill_gaps: { skill: string; domain: string }[];
  ats_score: number;
  improvements: string[];
  missing_keywords: string[];
}

type Tab = "jobs" | "skills" | "upskill" | "market";

function toAnalysis(scan: ScanRecord): Analysis {
  return {
    skills: scan.skills,
    recommended_roles: scan.recommended_roles,
    experience_level: scan.experience_level,
    skill_gaps: scan.skill_gaps,
    ats_score: scan.ats_score,
    improvements: scan.improvements,
    missing_keywords: scan.missing_keywords,
  };
}

export default function Dashboard() {
  const location = useLocation();
  
  // Validate nav data with error handling
  let navData: Analysis | undefined;
  try {
    const rawNavData = location.state?.analysis;
    navData = rawNavData ? validateAnalysis(rawNavData) : undefined;
  } catch {
    navData = undefined;
  }

  const navFileName = location.state?.fileName as string | undefined;
  const navExtractedText = location.state?.extractedText as string | undefined;
  const [extractedText] = useState<string>(navExtractedText ?? "");
  const [activeTab, setActiveTab] = useState<Tab>("jobs");
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveRoles, setLiveRoles] = useState<string[]>([]);
  const [cachedJobs, setCachedJobs] = useState<ScoredJob[]>([]);

  // Always fetch all scans on mount
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from("resume_scans")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data: rows, error }: { data: ScanRecord[] | null, error: unknown }) => {
        if (!error && rows && rows.length > 0) {
          setScans(rows);
          // Only auto-select a scan from history if there's no fresh navData
          // (i.e., user navigated directly to /dashboard, not from a fresh upload)
          if (!navData) {
            setSelectedScan(rows[0]);
          }
        }
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear job cache and live roles whenever the active scan changes
  useEffect(() => {
    setCachedJobs([]);
    setLiveRoles([]);
  }, [selectedScan?.id]);

  // selectedScan is only set when:
  // 1) User navigated directly to dashboard (no fresh upload) → auto-set to rows[0]
  // 2) User explicitly clicked a scan in the history panel
  // When navData exists (fresh upload) selectedScan stays null → data = navData (the new resume)
  const data: Analysis | undefined = selectedScan ? toAnalysis(selectedScan) : navData;

  const fileName = selectedScan?.file_name ?? navFileName ?? "Your resume";

  return (
    <>
      <Header />

      {loading ? (
        <div className="no-data">
          <p>Loading your scans...</p>
        </div>
      ) : !data && scans.length === 0 ? (
        <div className="no-data">
          <h2>No analysis found</h2>
          <p>Please upload and analyze a resume first.</p>
        </div>
      ) : (
        <div className="dashboard-page">
          <div className="dashboard-header">
            <h1>Career Analysis</h1>
            <p className="dashboard-subtext">
              Viewing: <strong>{fileName}</strong>
            </p>
          </div>

          <div className="dashboard-layout">
            {/* Scan history panel */}
            {scans.length > 0 && (
              <div className="scan-history-panel">
                <h3 className="scan-history-title">Scan History</h3>
                <div className="scan-history-list">
                  {scans.map((scan) => (
                    <div
                      key={scan.id}
                      className={`scan-history-item ${selectedScan?.id === scan.id ? "scan-history-item--active" : ""}`}
                      onClick={() => setSelectedScan(scan)}
                    >
                      <div className="scan-history-filename">
                        📄 {scan.file_name}
                      </div>
                      <div className="scan-history-meta">
                        <span className="scan-history-level">
                          {scan.experience_level}
                        </span>
                        <span className="scan-history-score">
                          ATS {scan.ats_score}
                        </span>
                      </div>
                      <div className="scan-history-date">
                        {new Date(scan.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data && (
              <div className="dashboard-grid">
                <aside className="dashboard-sidebar">
                  <div className="card dashboard-metrics">
                    <h3 className="card-title">Summary</h3>
                    <div className="metric-group">
                      <div className="metric-item">
                        <strong>{data.skills.length}</strong>
                        <span>Skills Found</span>
                      </div>
                      <div className="metric-item">
                        <strong>{liveRoles.length > 0 ? liveRoles.length : data.recommended_roles.length}</strong>
                        <span>Matching Roles</span>
                      </div>
                      <div className="metric-item">
                        <strong>{data.experience_level}</strong>
                        <span>Experience</span>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="card-title">Your Skills</h3>
                    <div className="skill-chip-grid">
                      {data.skills.map((skill, index) => (
                        <span key={index} className="skill-chip">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="card-title">
                      Matching Roles
                      {liveRoles.length > 0 && (
                        <span style={{ fontSize: "0.68rem", color: "#16a34a", fontWeight: 400, marginLeft: "8px" }}>● Live</span>
                      )}
                    </h3>
                    <div className="recommend-list">
                      {(liveRoles.length > 0 ? liveRoles : data.recommended_roles).map((role, i) => (
                        <div key={i} className="recommend-item">
                          {i + 1}. {role}
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>

                <main className="dashboard-main">
                  <div className="tab-container">
                    <button
                      onClick={() => setActiveTab("jobs")}
                      className={`tab ${activeTab === "jobs" ? "tab-active" : ""}`}
                    >
                      Jobs
                    </button>
                    <button
                      onClick={() => setActiveTab("skills")}
                      className={`tab ${activeTab === "skills" ? "tab-active" : ""}`}
                    >
                      Skill Gaps
                    </button>
                    <button
                      onClick={() => setActiveTab("upskill")}
                      className={`tab ${activeTab === "upskill" ? "tab-active" : ""}`}
                    >
                      Upskill
                    </button>
                    <button
                      onClick={() => setActiveTab("market")}
                      className={`tab ${activeTab === "market" ? "tab-active" : ""}`}
                    >
                      Market
                    </button>
                  </div>

                  <div className="card dashboard-content">
                    <ErrorBoundary>
                      {activeTab === "jobs" && <Jobs data={data} onRolesLoaded={setLiveRoles} cachedJobs={cachedJobs} onJobsCached={setCachedJobs} />}
                    </ErrorBoundary>
                    <ErrorBoundary>
                      {activeTab === "skills" && <SkillGaps data={data} />}
                    </ErrorBoundary>
                    <ErrorBoundary>
                      {activeTab === "upskill" && (
                        <Upskill data={data} extractedText={extractedText} />
                      )}
                    </ErrorBoundary>
                    <ErrorBoundary>
                      {activeTab === "market" && <Market data={data} />}
                    </ErrorBoundary>
                  </div>
                </main>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
