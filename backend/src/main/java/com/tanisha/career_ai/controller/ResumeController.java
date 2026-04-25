package com.tanisha.career_ai.controller;

import com.tanisha.career_ai.model.ResumeResponse;
import com.tanisha.career_ai.model.ResumeImproveRequest;
import com.tanisha.career_ai.service.ResumeService;

// import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<ResumeResponse> analyzeResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId,
            @RequestParam("fileName") String fileName) throws Exception {

        ResumeResponse response = resumeService.analyze(file, userId, fileName);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/improve")
    public ResponseEntity<byte[]> improveResume(
            @RequestParam("file") MultipartFile originalPdfFile,
            @RequestParam("resumeText") String resumeText,
            @RequestParam("improvements") String improvementsJson,
            @RequestParam("missingKeywords") String missingKeywordsJson,
            @RequestParam("skills") String skillsJson,
            @RequestParam("experienceLevel") String experienceLevel) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            ResumeImproveRequest request = new ResumeImproveRequest();
            request.setResumeText(resumeText);
            request.setImprovements(mapper.readValue(improvementsJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>(){}));
            request.setMissingKeywords(mapper.readValue(missingKeywordsJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>(){}));
            request.setSkills(mapper.readValue(skillsJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>(){}));
            request.setExperienceLevel(experienceLevel);

            byte[] pdfBytes = resumeService.improveAndModifyOriginalPdf(
                    request,
                    originalPdfFile.getBytes());
            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=\"improved_resume.pdf\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}