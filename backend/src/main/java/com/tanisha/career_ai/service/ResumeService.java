package com.tanisha.career_ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tanisha.career_ai.model.ResumeImproveRequest;
import com.tanisha.career_ai.model.ResumeResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.apache.tika.Tika;

import java.util.Map;
import java.util.HashMap;

@Service
public class ResumeService {

    private final LlmService llmService;
    private final Tika tika = new Tika();
    private final WebClient supabaseClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeService(
            LlmService llmService,
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.service-role-key}") String serviceRoleKey) {

        this.llmService = llmService;
        this.supabaseClient = WebClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", serviceRoleKey)
                .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("Prefer", "return=minimal")
                .build();
    }

    public ResumeResponse analyze(MultipartFile file, String userId, String fileName) throws Exception {
        String resumeText = tika.parseToString(file.getInputStream());
        Map<String, Object> analysisResult = llmService.analyzeResume(resumeText);
        saveToSupabase(userId, fileName, analysisResult, resumeText); // ← pass resumeText

        ResumeResponse response = new ResumeResponse();
        response.setAnalysis(analysisResult);
        response.setExtractedText(resumeText);
        return response;
    }

    private void saveToSupabase(String userId, String fileName, Map<String, Object> analysis, String resumeText) {
        try {
            Map<String, Object> row = new HashMap<>();
            row.put("user_id", userId);
            row.put("file_name", fileName);
            row.put("skills", analysis.get("skills"));
            row.put("recommended_roles", analysis.get("recommended_roles"));
            row.put("experience_level", analysis.get("experience_level"));
            row.put("skill_gaps", analysis.get("skill_gaps"));
            row.put("ats_score", analysis.get("ats_score"));
            row.put("improvements", analysis.get("improvements"));
            row.put("missing_keywords", analysis.get("missing_keywords"));
            row.put("extracted_text", resumeText); // ← add this

            String body = objectMapper.writeValueAsString(row);
            supabaseClient.post()
                    .uri("/rest/v1/resume_scans")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            System.err.println("Failed to save scan to Supabase: " + e.getMessage());
        }
    }

    public String improveResume(ResumeImproveRequest request) {
        return llmService.improveResume(
                request.getResumeText(),
                request.getImprovements(),
                request.getMissingKeywords(),
                request.getSkills(),
                request.getExperienceLevel());
    }

    public byte[] improveAndGeneratePdf(ResumeImproveRequest request) throws Exception {
        // Get improved text from LLM
        String improvedText = llmService.improveResume(
                request.getResumeText(),
                request.getImprovements(),
                request.getMissingKeywords(),
                request.getSkills(),
                request.getExperienceLevel());

        // Generate PDF from improved text
        return generatePdf(improvedText);
    }

    private byte[] generatePdf(String text) throws Exception {
        try (org.apache.pdfbox.pdmodel.PDDocument document = new org.apache.pdfbox.pdmodel.PDDocument()) {

            org.apache.pdfbox.pdmodel.font.PDFont regularFont = new org.apache.pdfbox.pdmodel.font.PDType1Font(
                    org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA);
            org.apache.pdfbox.pdmodel.font.PDFont boldFont = new org.apache.pdfbox.pdmodel.font.PDType1Font(
                    org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA_BOLD);

            float margin = 50;
            float pageWidth = org.apache.pdfbox.pdmodel.common.PDRectangle.A4.getWidth();
            float pageHeight = org.apache.pdfbox.pdmodel.common.PDRectangle.A4.getHeight();
            float contentWidth = pageWidth - 2 * margin;
            float yStart = pageHeight - margin;
            float y = yStart;

            org.apache.pdfbox.pdmodel.PDPage page = new org.apache.pdfbox.pdmodel.PDPage(
                    org.apache.pdfbox.pdmodel.common.PDRectangle.A4);
            document.addPage(page);
            org.apache.pdfbox.pdmodel.PDPageContentStream cs = new org.apache.pdfbox.pdmodel.PDPageContentStream(
                    document, page);

            String[] lines = text.split("\n");

            for (String rawLine : lines) {
                String line = rawLine.trim();

                // New page if needed
                if (y < margin + 20) {
                    cs.close();
                    page = new org.apache.pdfbox.pdmodel.PDPage(
                            org.apache.pdfbox.pdmodel.common.PDRectangle.A4);
                    document.addPage(page);
                    cs = new org.apache.pdfbox.pdmodel.PDPageContentStream(document, page);
                    y = yStart;
                }

                // Detect section headers (ALL CAPS lines or known keywords)
                boolean isHeader = !line.isEmpty() &&
                        (line.equals(line.toUpperCase()) && line.length() > 2 && !line.startsWith("•")
                                && !line.startsWith("-"));

                // Detect name (first non-empty line)
                boolean isName = y == yStart && !line.isEmpty();

                float fontSize = isName ? 18f : isHeader ? 11f : 10f;
                boolean isBold = isName || isHeader;

                if (line.isEmpty()) {
                    y -= 6; // blank line spacing
                    continue;
                }

                // Draw section header underline
                if (isHeader && !isName) {
                    y -= 4;
                    cs.setStrokingColor(0.2f, 0.2f, 0.2f);
                    cs.setLineWidth(0.5f);
                    cs.moveTo(margin, y);
                    cs.lineTo(pageWidth - margin, y);
                    cs.stroke();
                    y -= 2;
                }

                // Word wrap
                org.apache.pdfbox.pdmodel.font.PDFont font = isBold
                        ? boldFont
                        : regularFont;

                java.util.List<String> wrappedLines = wrapText(line, font, fontSize, contentWidth);

                for (String wrappedLine : wrappedLines) {
                    if (y < margin + 20) {
                        cs.close();
                        page = new org.apache.pdfbox.pdmodel.PDPage(
                                org.apache.pdfbox.pdmodel.common.PDRectangle.A4);
                        document.addPage(page);
                        cs = new org.apache.pdfbox.pdmodel.PDPageContentStream(document, page);
                        y = yStart;
                    }

                    cs.beginText();
                    cs.setFont(font, fontSize);
                    cs.newLineAtOffset(margin, y);
                    // Color headers in dark blue
                    if (isHeader) {
                        cs.setNonStrokingColor(0.11f, 0.37f, 0.53f);
                    } else {
                        cs.setNonStrokingColor(0f, 0f, 0f);
                    }
                    cs.showText(wrappedLine);
                    cs.endText();
                    y -= (fontSize + 4);
                }

                if (isHeader)
                    y -= 2;
            }

            cs.close();

            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private java.util.List<String> wrapText(String text, org.apache.pdfbox.pdmodel.font.PDFont font,
            float fontSize, float maxWidth) throws Exception {
        java.util.List<String> lines = new java.util.ArrayList<>();
        String[] words = text.split(" ");
        StringBuilder current = new StringBuilder();

        for (String word : words) {
            String test = current.length() == 0 ? word : current + " " + word;
            float width = font.getStringWidth(test) / 1000 * fontSize;
            if (width > maxWidth && current.length() > 0) {
                lines.add(current.toString());
                current = new StringBuilder(word);
            } else {
                current = new StringBuilder(test);
            }
        }
        if (current.length() > 0)
            lines.add(current.toString());
        return lines;
    }
}