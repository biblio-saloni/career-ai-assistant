package com.tanisha.career_ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tanisha.career_ai.model.ResumeImproveRequest;
import com.tanisha.career_ai.model.ResumeResponse;
import com.tanisha.career_ai.exception.InvalidResumeFormatException;
import com.tanisha.career_ai.exception.LlmServiceException;
import com.tanisha.career_ai.exception.DatabaseException;
import com.tanisha.career_ai.util.PdfGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.apache.tika.Tika;

import java.util.Map;
import java.util.HashMap;

@Service
public class ResumeService {
    private static final Logger logger = LoggerFactory.getLogger(ResumeService.class);

    private final LlmService llmService;
    private final Tika tika = new Tika();
    private final WebClient supabaseClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PdfGenerator pdfGenerator;

    public ResumeService(
            LlmService llmService,
            PdfGenerator pdfGenerator,
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.service-role-key}") String serviceRoleKey) {

        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            throw new IllegalArgumentException("supabase.url must be configured");
        }
        if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
            throw new IllegalArgumentException("supabase.service-role-key must be configured");
        }

        this.llmService = llmService;
        this.pdfGenerator = pdfGenerator;
        this.supabaseClient = WebClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", serviceRoleKey)
                .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("Prefer", "return=minimal")
                .build();
    }

    public ResumeResponse analyze(MultipartFile file, String userId, String fileName) throws Exception {
        logger.info("Starting resume analysis for user={}, fileName={}", userId, fileName);

        String resumeText;
        try {
            resumeText = tika.parseToString(file.getInputStream());
            if (resumeText == null || resumeText.isBlank()) {
                throw new InvalidResumeFormatException("Resume file appears to be empty or corrupted");
            }
            logger.debug("Successfully extracted {} characters from resume", resumeText.length());
        } catch (Exception e) {
            logger.error("Failed to parse resume file: {}", e.getMessage());
            throw new InvalidResumeFormatException("Could not extract text from resume. File may be corrupted.", e);
        }

        Map<String, Object> analysisResult;
        try {
            analysisResult = llmService.analyzeResume(resumeText);
            logger.info("Resume analysis completed for user={}, atsScore={}, roles={}", 
                    userId, analysisResult.get("ats_score"), analysisResult.get("recommended_roles"));
        } catch (LlmServiceException e) {
            logger.error("LLM service failed for user={}", userId, e);
            throw e;
        }

        try {
            saveToSupabase(userId, fileName, analysisResult, resumeText);
            logger.info("Analysis saved to Supabase for user={}", userId);
        } catch (DatabaseException e) {
            logger.error("Failed to save analysis to Supabase for user={}", userId, e);
            throw e;
        }

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
            row.put("extracted_text", resumeText);

            String body = objectMapper.writeValueAsString(row);
            String response = supabaseClient.post()
                    .uri("/rest/v1/resume_scans")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            logger.debug("Supabase response: {}", response);
        } catch (Exception e) {
            logger.error("Failed to save scan to Supabase for userId={}: {}", userId, e.getMessage());
            throw new DatabaseException("Could not save analysis to database", e);
        }
    }

    public String improveResume(ResumeImproveRequest request) throws LlmServiceException {
        try {
            return llmService.improveResume(
                    request.getResumeText(),
                    request.getImprovements(),
                    request.getMissingKeywords(),
                    request.getSkills(),
                    request.getExperienceLevel());
        } catch (LlmServiceException e) {
            logger.error("LLM service failed during resume improvement", e);
            throw e;
        }
    }

    public byte[] improveAndGeneratePdf(ResumeImproveRequest request) throws Exception {
        logger.info("Generating improved resume PDF");
        try {
            String improvedText = improveResume(request);
            byte[] pdfBytes = pdfGenerator.generate(improvedText);
            logger.info("Successfully generated PDF, size={} bytes", pdfBytes.length);
            return pdfBytes;
        } catch (Exception e) {
            logger.error("Failed to generate improved resume PDF", e);
            throw e;
        }
    }
}
            org.apache.pdfbox.pdmodel.font.PDFont boldFont = org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD;

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

    public byte[] improveAndModifyOriginalPdf(ResumeImproveRequest request, byte[] originalPdfBytes) throws Exception {
        // Get improved text from LLM
        String improvedText = llmService.improveResume(
                request.getResumeText(),
                request.getImprovements(),
                request.getMissingKeywords(),
                request.getSkills(),
                request.getExperienceLevel());

        // Modify original PDF with improved text
        return modifyPdfWithImprovedText(originalPdfBytes, request.getResumeText(), improvedText);
    }

    private byte[] modifyPdfWithImprovedText(byte[] originalPdfBytes, String originalText, String improvedText) throws Exception {
        byte[] improvementsPdfBytes = generatePdf("--- AI SUGGESTED IMPROVEMENTS ---\n\n" + improvedText);

        try (org.apache.pdfbox.pdmodel.PDDocument originalDoc = org.apache.pdfbox.pdmodel.PDDocument.load(originalPdfBytes);
             org.apache.pdfbox.pdmodel.PDDocument improvementsDoc = org.apache.pdfbox.pdmodel.PDDocument.load(improvementsPdfBytes)) {
            
            org.apache.pdfbox.multipdf.PDFMergerUtility merger = new org.apache.pdfbox.multipdf.PDFMergerUtility();
            
            // Append original resume to the improvements document
            merger.appendDocument(improvementsDoc, originalDoc);
            
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            improvementsDoc.save(baos);
            return baos.toByteArray();
        }
    }
}