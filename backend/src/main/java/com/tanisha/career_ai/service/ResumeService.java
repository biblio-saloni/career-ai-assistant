package com.tanisha.career_ai.service;

import com.tanisha.career_ai.model.ResumeResponse;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
public class ResumeService {

    public ResumeResponse analyze(MultipartFile file) throws Exception {

        String resumeText = extractText(file);

        List<String> skills = extractSkills(resumeText);

        List<String> roles = suggestRoles(skills);

        ResumeResponse response = new ResumeResponse();
        response.setSkills(skills);
        response.setRecommendedRoles(roles);

        return response;
    }

    private String extractText(MultipartFile file) throws Exception {

        Tika tika = new Tika();

        return tika.parseToString(file.getInputStream());
    }

    private List<String> extractSkills(String text) {

        List<String> skillDatabase = List.of(
                "Java","Spring Boot","React","JavaScript","TypeScript",
                "SQL","MySQL","PostgreSQL","MongoDB",
                "Docker","Kubernetes","AWS","HTML","CSS","Node.js"
        );

        List<String> detectedSkills = new ArrayList<>();

        String lowerText = text.toLowerCase();

        for (String skill : skillDatabase) {
            if (lowerText.contains(skill.toLowerCase())) {
                detectedSkills.add(skill);
            }
        }

        return detectedSkills;
    }

    private List<String> suggestRoles(List<String> skills) {

        List<String> roles = new ArrayList<>();

        if (skills.contains("React") || skills.contains("JavaScript")) {
            roles.add("Frontend Developer");
        }

        if (skills.contains("Java") && skills.contains("Spring Boot")) {
            roles.add("Backend Developer");
        }

        if (skills.contains("React") && skills.contains("Java")) {
            roles.add("Full Stack Developer");
        }

        if (skills.contains("Docker") || skills.contains("Kubernetes")) {
            roles.add("DevOps Engineer");
        }

        return roles;
    }
}