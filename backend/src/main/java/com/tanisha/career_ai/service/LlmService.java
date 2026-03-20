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

                IMPORTANT:
                - skill_gaps MUST be an array of objects
                - Each object MUST contain:
                  - skill (string)
                  - domain (string)
                - DO NOT return skill_gaps as strings

                Return ONLY valid JSON.
                DO NOT include markdown or extra text.

                Format:
                {
                  "skills": [],
                  "recommended_roles": [],
                  "experience_level": "",
                  "skill_gaps": [
                    {
                      "skill": "",
                      "domain": ""
                    }
                  ],
                  "ats_score": 0,
                  "improvements": [],
                  "missing_keywords": []
                }

                Resume:
                """ + resumeText;

        Map<String, Object> message = new java.util.HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new java.util.HashMap<>();
        requestBody.put("model", "llama-3.1-8b-instant");
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.7);

        String response = webClient.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .retry(2)
                .block();

        try {
            ObjectMapper objectMapper = new ObjectMapper();

            JsonNode root = objectMapper.readTree(response);

            String content = root
                    .path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText()
                    .trim();

            // Remove markdown if present
            if (content.startsWith("```")) {
                content = content.replaceAll("```json", "")
                        .replaceAll("```", "")
                        .trim();
            }

            // Extract JSON only
            int start = content.indexOf("{");
            int end = content.lastIndexOf("}");

            if (start != -1 && end != -1) {
                content = content.substring(start, end + 1);
            } else {
                throw new RuntimeException("No valid JSON found: " + content);
            }

            JsonNode actualJson = objectMapper.readTree(content);

            Map<String, Object> result = objectMapper.convertValue(
                    actualJson,
                    new TypeReference<Map<String, Object>>() {
                    });

            // 🛡️ SAFETY: fix skill_gaps if LLM returns strings
            Object skillGapsObj = result.get("skill_gaps");

            if (skillGapsObj instanceof List<?>) {
                List<?> list = (List<?>) skillGapsObj;

                if (!list.isEmpty() && list.get(0) instanceof String) {
                    List<Map<String, String>> formatted = list.stream()
                            .map(item -> Map.of(
                                    "skill", item.toString(),
                                    "domain", "General"))
                            .toList();

                    result.put("skill_gaps", formatted);
                }
            }

            // 🛡️ SAFETY: ensure all fields exist
            result.putIfAbsent("skills", List.of());
            result.putIfAbsent("recommended_roles", List.of());
            result.putIfAbsent("skill_gaps", List.of());
            result.putIfAbsent("improvements", List.of());
            result.putIfAbsent("missing_keywords", List.of());
            result.putIfAbsent("ats_score", 0);
            result.putIfAbsent("experience_level", "0");

            return result;

        } catch (Exception e) {
            System.out.println("RAW RESPONSE:\n" + response);
            throw new RuntimeException("Failed to parse LLM response", e);
        }
    }
}