package com.tanisha.career_ai.service;

import com.tanisha.career_ai.model.ResumeResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

import org.apache.tika.Tika;

@Service
public class ResumeService {

    private final LlmService llmService;
    private final Tika tika = new Tika(); // ✅ reuse

    public ResumeService(LlmService llmService) {
        this.llmService = llmService;
    }

    public ResumeResponse analyze(MultipartFile file) throws Exception {

        String resumeText = extractText(file);

        Map<String, Object> analysisResult =
                llmService.analyzeResume(resumeText);

        ResumeResponse response = new ResumeResponse();
        response.setAnalysis(analysisResult);

        return response;
    }

    private String extractText(MultipartFile file) throws Exception {
        return tika.parseToString(file.getInputStream());
    }
}