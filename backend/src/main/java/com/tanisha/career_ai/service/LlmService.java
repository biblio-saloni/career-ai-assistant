package com.tanisha.career_ai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.List;
import java.util.Map;

@Service
public class LlmService {

    private final WebClient webClient;

    public LlmService(@Value("${groq.api.key}") String apiKey) {

        this.webClient = WebClient.builder()
                .baseUrl("https://api.groq.com/openai/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public Map<String, Object> analyzeResume(String resumeText) {
        String prompt = """
                You are an expert ATS resume analyzer.

                Analyze the resume strictly and critically.

                IMPORTANT RULES:
                - ALWAYS return at least 3 skill_gaps
                - ALWAYS suggest improvements even if resume is good
                - Be honest and slightly strict

                Return ONLY valid JSON.

                Format:
                {
                  "skills": [],
                  "recommended_roles": [],
                  "experience_level": "",
                  "skill_gaps": [],
                  "ats_score": 0,
                  "improvements": [],
                  "missing_keywords": []
                }

                Guidelines:
                - skill_gaps = missing technical or domain skills
                - improvements = actionable resume improvements (e.g. "Add metrics", "Use action verbs")
                - ats_score = number between 0–100 based on ATS friendliness
                - missing_keywords = important keywords not found in resume

                Resume:
                """ + resumeText;

        Map<String, Object> message = new java.util.HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new java.util.HashMap<>();
        requestBody.put("model", "llama-3.1-8b-instant");
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.7); // optional but helps

        String response = webClient.post()
                .uri("/chat/completions") // 🔥 critical fix
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        try {
            ObjectMapper mapper = new ObjectMapper();

            JsonNode root = mapper.readTree(response);

            // Step 1: extract content string
            String content = root
                    .get("choices")
                    .get(0)
                    .get("message")
                    .get("content")
                    .asText();

            // Step 2: convert that JSON string into actual JSON object
            JsonNode actualJson = mapper.readTree(content);

            // Step 3: return clean JSON string
            return mapper.convertValue(actualJson, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse LLM response", e);
        }
    }
}