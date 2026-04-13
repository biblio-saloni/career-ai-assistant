package com.tanisha.career_ai.model;

public class ResumeImproveRequest {
    private String resumeText;
    private java.util.List<String> improvements;
    private java.util.List<String> missingKeywords;
    private java.util.List<String> skills;
    private String experienceLevel;

    public String getResumeText() {
        return resumeText;
    }

    public void setResumeText(String resumeText) {
        this.resumeText = resumeText;
    }

    public java.util.List<String> getImprovements() {
        return improvements;
    }

    public void setImprovements(java.util.List<String> improvements) {
        this.improvements = improvements;
    }

    public java.util.List<String> getMissingKeywords() {
        return missingKeywords;
    }

    public void setMissingKeywords(java.util.List<String> missingKeywords) {
        this.missingKeywords = missingKeywords;
    }

    public java.util.List<String> getSkills() {
        return skills;
    }

    public void setSkills(java.util.List<String> skills) {
        this.skills = skills;
    }

    public String getExperienceLevel() {
        return experienceLevel;
    }

    public void setExperienceLevel(String experienceLevel) {
        this.experienceLevel = experienceLevel;
    }
}
