package com.tanisha.career_ai.model;

import java.util.List;

public class ResumeResponse {

    private List<String> skills;
    private List<String> recommendedRoles;

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public List<String> getRecommendedRoles() {
        return recommendedRoles;
    }

    public void setRecommendedRoles(List<String> recommendedRoles) {
        this.recommendedRoles = recommendedRoles;
    }
}