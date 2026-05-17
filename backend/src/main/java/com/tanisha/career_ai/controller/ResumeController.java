package com.tanisha.career_ai.controller;

import com.tanisha.career_ai.model.ResumeResponse;
import com.tanisha.career_ai.model.ResumeImproveRequest;
import com.tanisha.career_ai.model.ErrorResponse;
import com.tanisha.career_ai.service.ResumeService;
import com.tanisha.career_ai.exception.InvalidResumeFormatException;
import com.tanisha.career_ai.exception.LlmServiceException;
import com.tanisha.career_ai.exception.DatabaseException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {
    private static final Logger logger = LoggerFactory.getLogger(ResumeController.class);
    private static final long MAX_FILE_SIZE = 10_000_000L; // 10MB
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword"
    );

    private final ResumeService resumeService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId,
            @RequestParam("fileName") String fileName) {

        try {
            // Validate inputs
            validateResumeFile(file);
            validateUserId(userId);
            validateFileName(fileName);

            logger.info("Analyzing resume for user={}, fileName={}, fileSize={}", userId, fileName, file.getSize());

            ResumeResponse response = resumeService.analyze(file, userId, fileName);
            return ResponseEntity.ok(response);

        } catch (InvalidResumeFormatException e) {
            logger.warn("Invalid resume format from user={}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("INVALID_FORMAT", e.getMessage())
            );
        } catch (LlmServiceException e) {
            logger.error("LLM service error for user={}", userId, e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                    new ErrorResponse("LLM_ERROR", "AI service temporarily unavailable. Please try again in a moment.")
            );
        } catch (DatabaseException e) {
            logger.error("Database error for user={}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ErrorResponse("DB_ERROR", "Could not save analysis. Please contact support.")
            );
        } catch (Exception e) {
            logger.error("Unexpected error during resume analysis for user={}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred. Please try again later.")
            );
        }
    }

    @PostMapping("/improve")
    public ResponseEntity<?> improveResume(
            @RequestParam("resumeText") String resumeText,
            @RequestParam("improvements") String improvementsJson,
            @RequestParam("missingKeywords") String missingKeywordsJson,
            @RequestParam("skills") String skillsJson,
            @RequestParam("experienceLevel") String experienceLevel) {

        try {
            if (resumeText == null || resumeText.isBlank()) {
                return ResponseEntity.badRequest().body(
                        new ErrorResponse("INVALID_INPUT", "Resume text is required")
                );
            }

            ResumeImproveRequest request = new ResumeImproveRequest();
            request.setResumeText(resumeText);
            request.setImprovements(objectMapper.readValue(improvementsJson, new TypeReference<List<String>>() {}));
            request.setMissingKeywords(objectMapper.readValue(missingKeywordsJson, new TypeReference<List<String>>() {}));
            request.setSkills(objectMapper.readValue(skillsJson, new TypeReference<List<String>>() {}));
            request.setExperienceLevel(experienceLevel);

            String improvedText = resumeService.improveResume(request);
            return ResponseEntity.ok(Map.of("improvedText", improvedText));

        } catch (LlmServiceException e) {
            logger.error("LLM service error during resume improvement", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                    new ErrorResponse("LLM_ERROR", "AI service temporarily unavailable. Please try again.")
            );
        } catch (Exception e) {
            logger.error("Error during resume improvement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ErrorResponse("INTERNAL_ERROR", "Error processing resume improvement. Please try again.")
            );
        }
    }

    private void validateResumeFile(MultipartFile file) throws InvalidResumeFormatException {
        if (file == null || file.isEmpty()) {
            throw new InvalidResumeFormatException("File is required and cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidResumeFormatException(
                    String.format("File size %.1f MB exceeds maximum of 10MB", file.getSize() / 1_000_000.0)
            );
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new InvalidResumeFormatException(
                    "Only PDF and DOCX files are supported. Received: " + contentType
            );
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || (!originalFilename.endsWith(".pdf") && !originalFilename.endsWith(".docx") && !originalFilename.endsWith(".doc"))) {
            throw new InvalidResumeFormatException("Invalid file extension. Only .pdf and .docx are allowed");
        }
    }

    private void validateUserId(String userId) throws InvalidResumeFormatException {
        if (userId == null || userId.isBlank()) {
            throw new InvalidResumeFormatException("User ID is required");
        }

        // Validate UUID format
        try {
            UUID.fromString(userId);
        } catch (IllegalArgumentException e) {
            throw new InvalidResumeFormatException("Invalid user ID format");
        }
    }

    private void validateFileName(String fileName) throws InvalidResumeFormatException {
        if (fileName == null || fileName.isBlank()) {
            throw new InvalidResumeFormatException("File name is required");
        }

        if (fileName.length() > 255) {
            throw new InvalidResumeFormatException("File name must be under 255 characters");
        }
    }
}
            request.setExperienceLevel(experienceLevel);

            String improvedText = resumeService.improveResume(request);
            return ResponseEntity.ok(java.util.Map.of("improvedText", improvedText));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error during improvement: " + e.getMessage());
        }
    }
}