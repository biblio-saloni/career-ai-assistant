import { useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import { Jobs } from "../components/tabs/Jobs";
import { SkillGaps } from "../components/tabs/SkillGaps";
import { Market } from "../components/tabs/Market";
import { Upskill } from "../components/tabs/Upskill";
import { Overview } from "../components/tabs/Overview";

export interface Analysis {
  skills: string[];
  recommended_roles: string[];
  experience_level: string;
  skill_gaps: { skill: string; domain: string }[];
  ats_score: number;
  improvements: string[];
  missing_keywords: string[];
}

type Tab = "overview" | "jobs" | "skills" | "upskill" | "market";

export default function Dashboard() {
  const location = useLocation();
  const data = location.state?.analysis as Analysis | undefined;

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <>
      <Header />
      {!data ? (
        <div className="no-data">
          <h2>No data found</h2>
          <p>Please upload and analyze a resume first.</p>
        </div>
      ) : (
        <div className="dashboard-page">
          <div className="dashboard-header">
            <h1>Career Analysis</h1>
            <p className="dashboard-subtext">Resume: {location.state?.fileName || "Your resume"}</p>
          </div>

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
                  className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}>
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("jobs")}
                  className={`tab ${activeTab === "jobs" ? "tab-active" : ""}`}>
                  Jobs
                </button>
                <button
                  onClick={() => setActiveTab("skills")}
                  className={`tab ${activeTab === "skills" ? "tab-active" : ""}`}>
                  Skill Gaps
                </button>
                <button
                  onClick={() => setActiveTab("upskill")}
                  className={`tab ${activeTab === "upskill" ? "tab-active" : ""}`}>
                  Upskill
                </button>
                <button
                  onClick={() => setActiveTab("market")}
                  className={`tab ${activeTab === "market" ? "tab-active" : ""}`}>
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
        </div>
      )}
    </>
  );
}
