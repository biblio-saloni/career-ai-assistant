package com.tanisha.career_ai.controller;

import com.tanisha.career_ai.model.ResumeResponse;
import com.tanisha.career_ai.service.ResumeService;
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
}