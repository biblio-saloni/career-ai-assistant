import { useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

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
  console.log("DATA:", data);

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Safety fallback
  if (!data) {
    return (
      <div className="p-6">
        <h2>No data found</h2>
        <p>Please upload and analyze a resume first.</p>
      </div>
    );
  }

  const navigate = useNavigate();

  return (
    <>
      <Header
        actions={
          <>
            <Button onClick={() => navigate("/upload")}>Upload</Button>
          </>
        }
      />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Career Dashboard</h1>
          <p className="text-muted">Your personalized career insights</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
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

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && <Overview data={data} />}
          {activeTab === "jobs" && <Jobs data={data} />}
          {activeTab === "skills" && <SkillGaps data={data} />}
          {activeTab === "upskill" && <Upskill data={data} />}
          {activeTab === "market" && <Market data={data} />}
        </div>
      </div>
    </>
  );
}
