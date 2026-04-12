import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import { Jobs } from "../components/tabs/Jobs";
import { SkillGaps } from "../components/tabs/SkillGaps";
import { Market } from "../components/tabs/Market";
import { Upskill } from "../components/tabs/Upskill";
import { Overview } from "../components/tabs/Overview";
import { supabase } from "../lib/supabaseClient";

export interface Analysis {
  skills: string[];
  recommended_roles: string[];
  experience_level: string;
  skill_gaps: { skill: string; domain: string }[];
  ats_score: number;
  improvements: string[];
  missing_keywords: string[];
}

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

type Tab = "overview" | "jobs" | "skills" | "upskill" | "market";

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
  const navData = location.state?.analysis as Analysis | undefined;
  const navFileName = location.state?.fileName as string | undefined;

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);

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
      .then(({ data: rows, error }: any) => {
        if (!error && rows && rows.length > 0) {
          setScans(rows);
          // If we came from upload, find that scan (most recent) as selected
          setSelectedScan(rows[0]);
        }
        setLoading(false);
      });
  }, []);

  // Determine what data to show:
  // navData takes priority for display but selectedScan controls the analysis shown
  const data: Analysis | undefined = selectedScan
    ? toAnalysis(selectedScan)
    : navData;

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
                        <strong>{data.recommended_roles.length}</strong>
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
                    <h3 className="card-title">Recommended Roles</h3>
                    <div className="recommend-list">
                      {data.recommended_roles.map((role, i) => (
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
                      onClick={() => setActiveTab("overview")}
                      className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
                    >
                      Overview
                    </button>
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
                    {activeTab === "overview" && <Overview data={data} />}
                    {activeTab === "jobs" && <Jobs data={data} />}
                    {activeTab === "skills" && <SkillGaps data={data} />}
                    {activeTab === "upskill" && <Upskill data={data} />}
                    {activeTab === "market" && <Market data={data} />}
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
