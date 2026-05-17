package com.tanisha.career_ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.tanisha.career_ai.exception.LlmServiceException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class LlmService {
    private static final Logger logger = LoggerFactory.getLogger(LlmService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LlmService(@Value("${groq.api.key}") String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalArgumentException("groq.api.key must be configured");
        }
        this.webClient = WebClient.builder()
                .baseUrl("https://api.groq.com/openai/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public Map<String, Object> analyzeResume(String resumeText) throws LlmServiceException {
        if (resumeText == null || resumeText.isBlank()) {
            throw new IllegalArgumentException("Resume text cannot be empty");
        }

        String prompt = """
                You are a senior technical recruiter at a top-tier tech company (Google, Microsoft, Amazon level).
                Your job is to analyze resumes with extreme precision and consistency.

                EXPERIENCE LEVEL RULES — follow these strictly based on total years of professional work experience:
                - "Fresher"   → 0 years (student, no job, only college projects)
                - "Junior"    → 0–1.5 years of professional experience
                - "Mid-Level" → 1.5–4 years of professional experience
                - "Senior"    → 4–8 years of professional experience
                - "Lead"      → 8+ years OR currently in a lead/architect/manager role

                IMPORTANT: Count only PAID professional work experience (internships count as 0.5x).
                Do NOT count college years, academic projects, or personal projects as experience.
                If the resume shows 3 years of work experience → "Mid-Level". Non-negotiable.

                ATS SCORE RULES — calculate out of 100:
                - Contact info complete (name, email, phone, LinkedIn): 10 pts
                - Professional summary/objective present: 10 pts
                - Measurable achievements (numbers, percentages, impact): 20 pts
                - Keyword density for the target role: 20 pts
                - Clean formatting (sections, headings, no tables/graphics): 20 pts
                - Education section present: 10 pts
                - Relevant certifications or courses: 10 pts

                SKILL GAP RULES:
                - Compare the candidate's skills against what's TYPICALLY required for their recommended roles
                - Only list skills that are genuinely missing — not ones already present in the resume
                - Minimum 4 skill gaps, maximum 8
                - Be specific: not just "Cloud" but "AWS Lambda" or "GCP Cloud Run"

                IMPROVEMENTS RULES:
                - Be brutally specific — not "add metrics" but "Quantify your internship at X: how many users, how much performance improved, what was the scale"
                - Minimum 4 improvements
                - Each improvement must reference something actually in (or missing from) the resume

                MISSING KEYWORDS RULES:
                - These are ATS keywords that recruiters search for, relevant to the recommended roles
                - Must be real industry terms, not generic words
                - Minimum 5 keywords

                CONSISTENCY RULE:
                - Given the same resume text, always return the exact same JSON
                - Do not vary your analysis between runs

                Return ONLY this raw JSON with no markdown, no backticks, no explanation:
                {
                  "skills": ["skill1", "skill2"],
                  "recommended_roles": ["role1", "role2", "role3"],
                  "experience_level": "Mid-Level",
                  "skill_gaps": [
                    { "skill": "AWS Lambda", "domain": "Cloud" },
                    { "skill": "Kubernetes", "domain": "DevOps" }
                  ],
                  "ats_score": 74,
                  "improvements": [
                    "Your project X lacks measurable impact — add metrics like response time, user count, or cost saved",
                    "Add a professional summary at the top targeting your desired role"
                  ],
                  "missing_keywords": ["CI/CD", "Microservices", "REST API", "Agile", "System Design"]
                }

                Resume text to analyze:
                """
                + resumeText;

        Map<String, Object> message = new java.util.HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new java.util.HashMap<>();
        requestBody.put("model", "llama-3.3-70b-versatile");
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.0);
        requestBody.put("seed", 42);

        String response;
        try {
            logger.debug("Sending resume analysis request to Groq API");
            response = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .retry(2)
                    .block();
            
            if (response == null || response.isBlank()) {
                throw new LlmServiceException("Empty response from Groq API");
            }
        } catch (Exception e) {
            logger.error("Failed to call Groq API: {}", e.getMessage());
            throw new LlmServiceException("Failed to call Groq API: " + e.getMessage(), e);
        }

        try {
            return parseGroqResponse(response);
        } catch (Exception e) {
            logger.error("Failed to parse Groq response: {}", e.getMessage());
            throw new LlmServiceException("Failed to parse AI response: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> parseGroqResponse(String response) throws Exception {
        JsonNode root = objectMapper.readTree(response);
        
        // Check for API error
        if (root.has("error")) {
            String errorMsg = root.path("error").path("message").asText("Unknown error");
            throw new LlmServiceException("Groq API error: " + errorMsg);
        }

        String content = Optional.of(root)
                .map(n -> n.path("choices").get(0))
                .map(n -> n.path("message"))
                .map(n -> n.path("content"))
                .map(JsonNode::asText)
                .orElseThrow(() -> new LlmServiceException("Invalid response structure from Groq"))
                .trim();

        // Strip markdown if present
        if (content.startsWith("```")) {
            content = content.replaceAll("```json", "").replaceAll("```", "").trim();
        }

        // Extract JSON boundaries
        int start = content.indexOf("{");
        int end = content.lastIndexOf("}");
        if (start == -1 || end == -1) {
            throw new LlmServiceException("No valid JSON found in response");
        }
        content = content.substring(start, end + 1);

        JsonNode actualJson = objectMapper.readTree(content);
        Map<String, Object> result = objectMapper.convertValue(
                actualJson, new TypeReference<Map<String, Object>>() {});

        // Fix skill_gaps if LLM returns strings instead of objects
        Object skillGapsObj = result.get("skill_gaps");
        if (skillGapsObj instanceof List<?>) {
            List<?> list = (List<?>) skillGapsObj;
            if (!list.isEmpty()) {
                Object first = list.get(0);
                if (first instanceof String) {
                    List<Map<String, String>> formatted = list.stream()
                            .map(item -> Map.of("skill", item.toString(), "domain", "General"))
                            .toList();
                    result.put("skill_gaps", formatted);
                }
            }
        }

        // Ensure all required fields exist
        result.putIfAbsent("skills", List.of());
        result.putIfAbsent("recommended_roles", List.of());
        result.putIfAbsent("skill_gaps", List.of());
        result.putIfAbsent("improvements", List.of());
        result.putIfAbsent("missing_keywords", List.of());
        result.putIfAbsent("ats_score", 0);
        result.putIfAbsent("experience_level", "Fresher");

        logger.debug("Successfully parsed resume analysis response");
        return result;
    }

    public String improveResume(String resumeText, List<String> improvements,
            List<String> missingKeywords, List<String> skills,
            String experienceLevel) throws LlmServiceException {

        if (resumeText == null || resumeText.isBlank()) {
            throw new IllegalArgumentException("Resume text cannot be empty");
        }

        String improvementsList = String.join("\n- ", improvements);
        String keywordsList = String.join(", ", missingKeywords);
        String skillsList = String.join(", ", skills);

        String prompt = """
                You are an expert resume writer and ATS optimization specialist.

                Your task is to rewrite the resume below applying ONLY the listed improvements.

                STRICT RULES:
                - Keep ALL existing experience, education, skills, and facts — do NOT remove anything
                - Do NOT invent new jobs, degrees, or experiences that are not in the original
                - Add the missing keywords naturally into existing bullet points where they genuinely fit
                - Quantify achievements where numbers are missing but keep them realistic based on context
                - Add a professional summary at the top if one is missing
                - Improve bullet point phrasing to be more impactful and action-verb led
                - Do NOT change job titles, company names, dates, or education details
                - Every change must improve ATS score — do not remove existing keywords

                IMPROVEMENTS TO APPLY:
                - """ + improvementsList + """

                MISSING KEYWORDS TO INCORPORATE (where they naturally fit):
                """ + keywordsList + """

                EXISTING SKILLS (do not remove these):
                """ + skillsList + """

                Return the improved resume as clean plain text, properly structured with sections:
                CONTACT INFO
                PROFESSIONAL SUMMARY
                EXPERIENCE
                SKILLS
                EDUCATION
                CERTIFICATIONS

                Do NOT return markdown or any explanation — just the plain text resume.

                Original resume:
                """
                + resumeText;

        Map<String, Object> message = new java.util.HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new java.util.HashMap<>();
        requestBody.put("model", "llama-3.3-70b-versatile");
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.2);

        try {
            logger.debug("Sending resume improvement request to Groq API");
            String response = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .retry(2)
                    .block();

            if (response == null || response.isBlank()) {
                throw new LlmServiceException("Empty response from Groq API during resume improvement");
            }

            JsonNode root = objectMapper.readTree(response);
            
            if (root.has("error")) {
                String errorMsg = root.path("error").path("message").asText("Unknown error");
                throw new LlmServiceException("Groq API error: " + errorMsg);
            }

            String improvedText = Optional.of(root)
                    .map(n -> n.path("choices").get(0))
                    .map(n -> n.path("message"))
                    .map(n -> n.path("content"))
                    .map(JsonNode::asText)
                    .orElseThrow(() -> new LlmServiceException("Invalid response structure from Groq"))
                    .trim();

            logger.debug("Successfully generated improved resume");
            return improvedText;

        } catch (LlmServiceException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed during resume improvement: {}", e.getMessage());
            throw new LlmServiceException("Failed to improve resume: " + e.getMessage(), e);
        }
    }
}