export interface Analysis {
  skills: string[];
  recommended_roles: string[];
  experience_level: string;
  skill_gaps: { skill: string; domain: string }[];
  ats_score: number;
  improvements: string[];
  missing_keywords: string[];
}

export function validateAnalysis(obj: unknown): Analysis {
  if (!obj || typeof obj !== "object") {
    throw new Error("Invalid analysis data");
  }

  const a = obj as any;

  if (!Array.isArray(a.skills) || a.skills.some((s: unknown) => typeof s !== "string")) {
    throw new Error("Invalid skills array");
  }

  if (!Array.isArray(a.recommended_roles) || a.recommended_roles.some((r: unknown) => typeof r !== "string")) {
    throw new Error("Invalid recommended_roles array");
  }

  if (typeof a.experience_level !== "string") {
    throw new Error("Invalid experience_level");
  }

  if (!Array.isArray(a.skill_gaps) || !a.skill_gaps.every((g: any) => typeof g.skill === "string" && typeof g.domain === "string")) {
    throw new Error("Invalid skill_gaps array");
  }

  if (typeof a.ats_score !== "number" || a.ats_score < 0 || a.ats_score > 100) {
    throw new Error("Invalid ats_score");
  }

  if (!Array.isArray(a.improvements) || a.improvements.some((i: unknown) => typeof i !== "string")) {
    throw new Error("Invalid improvements array");
  }

  if (!Array.isArray(a.missing_keywords) || a.missing_keywords.some((k: unknown) => typeof k !== "string")) {
    throw new Error("Invalid missing_keywords array");
  }

  return a;
}
