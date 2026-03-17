package com.tanisha.career_ai.model;

import java.util.Map;

public class ResumeResponse {

    private Map<String, Object> analysis;
    private String extractedText; // optional

    public Map<String, Object> getAnalysis() {
        return analysis;
    }

    public void setAnalysis(Map<String, Object> analysis) {
        this.analysis = analysis;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }
}