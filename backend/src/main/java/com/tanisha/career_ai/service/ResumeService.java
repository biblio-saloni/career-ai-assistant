package com.tanisha.career_ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tanisha.career_ai.model.ResumeImproveRequest;
import com.tanisha.career_ai.model.ResumeResponse;
import com.tanisha.career_ai.exception.InvalidResumeFormatException;
import com.tanisha.career_ai.exception.LlmServiceException;
import com.tanisha.career_ai.exception.DatabaseException;
import com.tanisha.career_ai.util.PdfGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.apache.tika.Tika;

import java.util.Map;
import java.util.HashMap;

@Service
public class ResumeService {
    private static final Logger logger = LoggerFactory.getLogger(ResumeService.class);

    private final LlmService llmService;
    private final Tika tika = new Tika();
    private final WebClient supabaseClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PdfGenerator pdfGenerator;

    public ResumeService(
            LlmService llmService,
            PdfGenerator pdfGenerator,
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.service-role-key}") String serviceRoleKey) {

        this.llmService = llmService;
        this.pdfGenerator = pdfGenerator;
        this.supabaseClient = WebClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", serviceRoleKey)
                .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("Prefer", "return=minimal")
                .build();
    }

    public ResumeResponse analyze(MultipartFile file, String userId, String fileName) throws Exception {
        logger.info("Starting resume analysis for user={}, fileName={}", userId, fileName);

        String resumeText;
        try {
            resumeText = tika.parseToString(file.getInputStream());
            if (resumeText == null || resumeText.isBlank()) {
                throw new InvalidResumeFormatException("Resume file appears to be empty or corrupted");
            }
        } catch (InvalidResumeFormatException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to parse resume file: {}", e.getMessage());
            throw new InvalidResumeFormatException("Could not extract text from resume. File may be corrupted.");
        }

        Map<String, Object> analysisResult;
        try {
            analysisResult = llmService.analyzeResume(resumeText);
        } catch (LlmServiceException e) {
            logger.error("LLM service failed for user={}", userId, e);
            throw e;
        }

        try {
            saveToSupabase(userId, fileName, analysisResult, resumeText);
        } catch (DatabaseException e) {
            logger.error("Failed to save to Supabase for user={}", userId, e);
            throw e;
        }

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
            row.put("extracted_text", resumeText);

            String body = objectMapper.writeValueAsString(row);
            supabaseClient.post()
                    .uri("/rest/v1/resume_scans")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            logger.error("Failed to save to Supabase userId={}: {}", userId, e.getMessage());
            throw new DatabaseException("Could not save analysis to database", e);
        }
    }

    public String improveResume(ResumeImproveRequest request) {
        try {
            return llmService.improveResume(
                    request.getResumeText(),
                    request.getImprovements(),
                    request.getMissingKeywords(),
                    request.getSkills(),
                    request.getExperienceLevel());
        } catch (LlmServiceException e) {
            logger.error("LLM service failed during resume improvement", e);
            throw e;
        }
    }

    public byte[] improveAndGeneratePdf(ResumeImproveRequest request) throws Exception {
        logger.info("Generating improved resume PDF");
        String improvedText = improveResume(request);
        byte[] pdfBytes = pdfGenerator.generate(improvedText);
        logger.info("Successfully generated PDF, size={} bytes", pdfBytes.length);
        return pdfBytes;
    }
}