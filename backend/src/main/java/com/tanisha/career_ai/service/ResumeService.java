package com.tanisha.career_ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tanisha.career_ai.model.ResumeImproveRequest;
import com.tanisha.career_ai.model.ResumeResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.apache.tika.Tika;

import java.util.Map;
import java.util.HashMap;

@Service
public class ResumeService {

    private final LlmService llmService;
    private final Tika tika = new Tika();
    private final WebClient supabaseClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeService(
            LlmService llmService,
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.service-role-key}") String serviceRoleKey) {

        this.llmService = llmService;
        this.supabaseClient = WebClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", serviceRoleKey)
                .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("Prefer", "return=minimal")
                .build();
    }

    public ResumeResponse analyze(MultipartFile file, String userId, String fileName) throws Exception {
        String resumeText = tika.parseToString(file.getInputStream());
        Map<String, Object> analysisResult = llmService.analyzeResume(resumeText);
        saveToSupabase(userId, fileName, analysisResult, resumeText); // ← pass resumeText

        ResumeResponse response = new ResumeResponse();
        response.setAnalysis(analysisResult);
        response.setExtractedText(resumeText);
        return response;
    }

    private void saveToSupabase(String userId, String fileName, Map<String, Object> analysis, String resumeText) {
        try {
            Map<String, Object> row = new HashMap<>();
            row.put("user_id", userId);
            row.put("file_name", fileName);
            row.put("skills", analysis.get("skills"));
            row.put("recommended_roles", analysis.get("recommended_roles"));
            row.put("experience_level", analysis.get("experience_level"));
            row.put("skill_gaps", analysis.get("skill_gaps"));
            row.put("ats_score", analysis.get("ats_score"));
            row.put("improvements", analysis.get("improvements"));
            row.put("missing_keywords", analysis.get("missing_keywords"));
            row.put("extracted_text", resumeText); // ← add this

            String body = objectMapper.writeValueAsString(row);
            supabaseClient.post()
                    .uri("/rest/v1/resume_scans")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            System.err.println("Failed to save scan to Supabase: " + e.getMessage());
        }
    }

    public String improveResume(ResumeImproveRequest request) {
        return llmService.improveResume(
                request.getResumeText(),
                request.getImprovements(),
                request.getMissingKeywords(),
                request.getSkills(),
                request.getExperienceLevel());
    }
}