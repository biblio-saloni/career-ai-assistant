package com.tanisha.career_ai.util;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class PdfGenerator {

    public byte[] generate(String text) throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDFont regularFont = PDType1Font.HELVETICA;
            PDFont boldFont = PDType1Font.HELVETICA_BOLD;

            float margin = 50;
            float pageWidth = PDRectangle.A4.getWidth();
            float pageHeight = PDRectangle.A4.getHeight();
            float contentWidth = pageWidth - 2 * margin;
            float yStart = pageHeight - margin;
            float y = yStart;

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(document, page);

            String[] lines = text.split("\n");

            for (String rawLine : lines) {
                String line = rawLine.trim();

                // New page if needed
                if (y < margin + 20) {
                    cs.close();
                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);
                    cs = new PDPageContentStream(document, page);
                    y = yStart;
                }

                // Detect section headers (ALL CAPS lines)
                boolean isHeader = !line.isEmpty() &&
                        (line.equals(line.toUpperCase()) && line.length() > 2 && !line.startsWith("•")
                                && !line.startsWith("-"));

                // Detect name (first non-empty line)
                boolean isName = y == yStart && !line.isEmpty();

                float fontSize = isName ? 18f : isHeader ? 11f : 10f;
                boolean isBold = isName || isHeader;

                if (line.isEmpty()) {
                    y -= 6;
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
                PDFont font = isBold ? boldFont : regularFont;
                List<String> wrappedLines = wrapText(line, font, fontSize, contentWidth);

                for (String wrappedLine : wrappedLines) {
                    if (y < margin + 20) {
                        cs.close();
                        page = new PDPage(PDRectangle.A4);
                        document.addPage(page);
                        cs = new PDPageContentStream(document, page);
                        y = yStart;
                    }

                    cs.beginText();
                    cs.setFont(font, fontSize);
                    cs.newLineAtOffset(margin, y);
                    if (isHeader) {
                        cs.setNonStrokingColor(0.11f, 0.37f, 0.53f);
                    } else {
                        cs.setNonStrokingColor(0f, 0f, 0f);
                    }
                    cs.showText(wrappedLine);
                    cs.endText();
                    y -= (fontSize + 4);
                }

                if (isHeader) {
                    y -= 2;
                }
            }

            cs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private List<String> wrapText(String text, PDFont font, float fontSize, float contentWidth) throws IOException {
        List<String> lines = new ArrayList<>();
        StringBuilder line = new StringBuilder();
        String[] words = text.split(" ");

        for (String word : words) {
            String testLine = line.isEmpty() ? word : line + " " + word;
            float width = font.getStringWidth(testLine) / 1000 * fontSize;

            if (width < contentWidth) {
                if (!line.isEmpty()) {
                    line.append(" ");
                }
                line.append(word);
            } else {
                if (!line.isEmpty()) {
                    lines.add(line.toString());
                }
                line = new StringBuilder(word);
            }
        }

        if (!line.isEmpty()) {
            lines.add(line.toString());
        }

        return lines;
    }
}
