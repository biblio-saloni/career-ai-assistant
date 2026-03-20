export interface Analysis {
    skills: string[];
    recommended_roles: string[];
    experience_level: string;
    skill_gaps: { skill: string; domain: string }[];
    ats_score: number;
    improvements: string[];
    missing_keywords: string[];
  }