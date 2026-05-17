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
import java.util.ArrayList;
import java.util.Optional;

@Service
public class JobScoringService {
    private static final Logger logger = LoggerFactory.getLogger(JobScoringService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String rapidApiKey;
    private final String groqApiKey;

    public JobScoringService(
            @Value("${rapid.api.key:}") String rapidApiKey,
            @Value("${groq.api.key}") String groqApiKey) {
        this.rapidApiKey = rapidApiKey;
        this.groqApiKey = groqApiKey;
        this.webClient = WebClient.create();
    }

    public List<Map<String, Object>> scoreJobsForCandidate(
            String roleQuery,
            String skills,
            String expLevel,
            String groqApiKeyParam) throws LlmServiceException {

        logger.info("Fetching jobs for query={}, skills={}, level={}", roleQuery, skills, expLevel);

        // Use provided key or fall back to config
        String apiKey = groqApiKeyParam != null && !groqApiKeyParam.isBlank() ? groqApiKeyParam : groqApiKey;

        // Step 1: Fetch raw jobs
        List<Map<String, Object>> rawJobs = fetchJobsFromRapidAPI(roleQuery);
        if (rawJobs.isEmpty()) {
            logger.warn("No jobs found for query={}", roleQuery);
            throw new LlmServiceException("No live jobs found for this role. Try again later or adjust search terms.");
        }

        // Step 2: Score jobs with Groq
        List<Map<String, Object>> scoredJobs = scoreJobsWithGroq(rawJobs, skills, expLevel, apiKey);

        logger.info("Successfully scored {} jobs", scoredJobs.size());
        return scoredJobs;
    }

    private List<Map<String, Object>> fetchJobsFromRapidAPI(String query) throws LlmServiceException {
        if (rapidApiKey == null || rapidApiKey.isBlank()) {
            logger.error("RapidAPI key not configured");
            throw new LlmServiceException("Job search service not configured. Please contact support.");
        }

        try {
            logger.debug("Calling JSearch API with query={}", query);

            String response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("jsearch.p.rapidapi.com")
                            .path("/search")
                            .queryParam("query", query)
                            .queryParam("num_pages", "2")
                            .queryParam("date_posted", "month")
                            .queryParam("employment_types", "FULLTIME")
                            .build())
                    .header("X-RapidAPI-Key", rapidApiKey)
                    .header("X-RapidAPI-Host", "jsearch.p.rapidapi.com")
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .map(body -> new LlmServiceException("Job search failed: " + body))
                                    .flatMap(ex -> reactor.core.publisher.Mono.error(ex)))
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(response);
            List<Map<String, Object>> jobs = new ArrayList<>();

            if (root.has("data") && root.get("data").isArray()) {
                for (JsonNode job : root.get("data")) {
                    Map<String, Object> jobMap = objectMapper.convertValue(job,
                            new TypeReference<Map<String, Object>>() {
                            });
                    jobs.add(jobMap);
                }
            }

            logger.info("Fetched {} jobs from RapidAPI", jobs.size());
            return jobs;

        } catch (LlmServiceException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to fetch jobs from RapidAPI: {}", e.getMessage());
            throw new LlmServiceException("Failed to fetch job listings: " + e.getMessage(), e);
        }
    }

    private List<Map<String, Object>> scoreJobsWithGroq(
            List<Map<String, Object>> rawJobs,
            String skills,
            String expLevel,
            String apiKey) throws LlmServiceException {

        try {
            String jobSummaries = buildJobSummaries(rawJobs);

            String systemPrompt = buildGroqSystemPrompt(skills, expLevel, rawJobs.size());
            String userPrompt = String.format(
                    "Score ALL %d jobs for this candidate and return exactly %d objects sorted by match:\n\n%s",
                    rawJobs.size(), rawJobs.size(), jobSummaries);

            logger.debug("Sending {} jobs to Groq for scoring", rawJobs.size());

            Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.3-70b-versatile",
                    "max_tokens", 4000,
                    "temperature", 0.2,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)));

            String response = webClient.post()
                    .uri("https://api.groq.com/openai/v1/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .map(body -> new LlmServiceException("Job search failed: " + body))
                                    .flatMap(ex -> reactor.core.publisher.Mono.error(ex)))
                    .bodyToMono(String.class)
                    .block();

            return parseGroqScoredJobs(response, rawJobs);

        } catch (LlmServiceException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to score jobs with Groq: {}", e.getMessage());
            throw new LlmServiceException("Failed to score jobs: " + e.getMessage(), e);
        }
    }

    private String buildJobSummaries(List<Map<String, Object>> rawJobs) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < rawJobs.size(); i++) {
            Map<String, Object> job = rawJobs.get(i);
            String title = (String) job.get("job_title");
            if (title == null) title = "Unknown";
            String company = (String) job.get("employer_name");
            if (company == null) company = "Unknown";
            String description = (String) job.get("job_description");
            if (description == null) description = "";
            description = description.replaceAll("\\s+", " ").substring(0, Math.min(300, description.length()));

            List<String> locParts = new ArrayList<>();
            String city = (String) job.get("job_city");
            if (city == null) city = "";
            String state = (String) job.get("job_state");
            if (state == null) state = "";
            String country = (String) job.get("job_country");
            if (country == null) country = "";
            
            if (!city.isEmpty())
                locParts.add(city);
            if (!state.isEmpty())
                locParts.add(state);
            if (!country.isEmpty())
                locParts.add(country);
            String loc = locParts.isEmpty() ? "India" : String.join(", ", locParts);
            if (loc.isEmpty())
                loc = "India";

            sb.append(String.format("[%d] \"%s\" at %s (%s) — %s\n\n", i, title, company, loc, description));
        }
        return sb.toString();
    }

    private String buildGroqSystemPrompt(String skills, String expLevel, int jobCount) {
        return String.format(
                """
                        You are a brutally honest job-fit evaluator. Score ALL provided jobs using this strict weighted formula:

                        SCORING (compute "match" as weighted average):

                        1. SKILL OVERLAP (50%%):
                           - Candidate skills: %s
                           - skill_score = (matched_required_skills / total_required_skills) * 100
                           - Only 1–2 skill matches out of 8+ required → skill_score ≤ 30

                        2. EXPERIENCE FIT (35%%):
                           - Candidate level: %s
                           - Fresher/Junior (0–2 yrs): 0–3 yrs req → 100, 4–5 yrs → 50, 6+ → 10
                           - Mid-Level (2–4 yrs): 0–4 yrs req → 100, 5–6 yrs → 50, 7+ → 10
                           - Senior (4+ yrs): 0–6 yrs req → 100, 7+ → 70

                        3. ROLE ALIGNMENT (15%%):
                           - Exact match (same tech domain) → 100
                           - Partial (adjacent domain) → 60
                           - Mismatch (completely different stack) → 10

                        FINAL match = round(skill_score*0.5 + exp_score*0.35 + role_score*0.15)

                        RULES:
                        - Never inflate. A poor match should score 30–55, not 80+.
                        - difficulty: "easy" if match ≥ 75; "medium" if 55–74; "hard" if < 55
                        - type: "product" if known product company; else "service"
                        - skills: exactly 3 skills the candidate actually has that this job needs
                        - insight: ONE honest sentence about fit AND gaps
                        - recruiterTip: Brief actionable advice
                        - Return ALL %d jobs sorted by match score descending.
                        - Return ONLY a raw JSON array — no markdown, no explanation.

                        JSON shape per object: { index, title, company, location, type, match, skills, difficulty, insight, recruiterTip }""",
                skills, expLevel, jobCount);
    }

    private List<Map<String, Object>> parseGroqScoredJobs(String response, List<Map<String, Object>> rawJobs)
            throws Exception {
        JsonNode root = objectMapper.readTree(response);

        if (root.has("error")) {
            logger.error("Groq error: {}", root.path("error").path("message").asText());
            throw new LlmServiceException("AI service error");
        }

        String text = Optional.of(root)
                .map(n -> n.path("choices").get(0))
                .map(n -> n.path("message"))
                .map(n -> n.path("content"))
                .map(JsonNode::asText)
                .orElseThrow(() -> new LlmServiceException("Invalid Groq response structure"));

        int s = text.indexOf("[");
        int e = text.lastIndexOf("]");
        if (s == -1 || e == -1) {
            throw new LlmServiceException("Could not extract job scores from AI response");
        }

        List<Map<String, Object>> scored = new ArrayList<>();
        try {
            List<Map<String, Object>> items = objectMapper.readValue(
                    text.substring(s, e + 1),
                    new TypeReference<List<Map<String, Object>>>() {
                    });

            for (Map<String, Object> item : items) {
                int index = ((Number) item.get("index")).intValue();
                if (index < rawJobs.size()) {
                    Map<String, Object> rawJob = rawJobs.get(index);
                    String applyLink = (String) rawJob.get("job_apply_link");
                    String googleLink = (String) rawJob.get("job_google_link");
                    String finalLink = "";
                    if (applyLink != null && !applyLink.isBlank()) {
                        finalLink = applyLink;
                    } else if (googleLink != null && !googleLink.isBlank()) {
                        finalLink = googleLink;
                    }
                    item.put("applyUrl", finalLink);
                    scored.add(item);
                }
            }
        } catch (Exception ex) {
            logger.error("Failed to parse scored jobs: {}", ex.getMessage());
            throw new LlmServiceException("Failed to parse job scores", ex);
        }

        return scored;
    }
}
