package com.tanisha.career_ai.controller;

import com.tanisha.career_ai.model.ErrorResponse;
import com.tanisha.career_ai.service.JobScoringService;
import com.tanisha.career_ai.exception.LlmServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
public class JobController {
    private static final Logger logger = LoggerFactory.getLogger(JobController.class);

    private final JobScoringService jobScoringService;

    public JobController(JobScoringService jobScoringService) {
        this.jobScoringService = jobScoringService;
    }

    @PostMapping("/score")
    public ResponseEntity<?> scoreJobs(
            @RequestParam("roleQuery") String roleQuery,
            @RequestParam("skills") String skills,
            @RequestParam("expLevel") String expLevel,
            @RequestParam(value = "groqApiKey", required = false) String groqApiKey) {

        try {
            if (roleQuery == null || roleQuery.isBlank()) {
                return ResponseEntity.badRequest().body(
                        new ErrorResponse("INVALID_INPUT", "Role query is required")
                );
            }
            if (skills == null || skills.isBlank()) {
                return ResponseEntity.badRequest().body(
                        new ErrorResponse("INVALID_INPUT", "Skills are required")
                );
            }
            if (expLevel == null || expLevel.isBlank()) {
                return ResponseEntity.badRequest().body(
                        new ErrorResponse("INVALID_INPUT", "Experience level is required")
                );
            }

            logger.info("Scoring jobs for roleQuery={}", roleQuery);

            List<Map<String, Object>> scoredJobs = jobScoringService.scoreJobsForCandidate(
                    roleQuery, skills, expLevel, groqApiKey
            );

            return ResponseEntity.ok(Map.of(
                    "jobs", scoredJobs,
                    "count", scoredJobs.size()
            ));

        } catch (LlmServiceException e) {
            logger.warn("Job scoring failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                    new ErrorResponse("SERVICE_ERROR", e.getMessage())
            );
        } catch (Exception e) {
            logger.error("Unexpected error during job scoring", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ErrorResponse("INTERNAL_ERROR", "Failed to score jobs. Please try again.")
            );
        }
    }
}
