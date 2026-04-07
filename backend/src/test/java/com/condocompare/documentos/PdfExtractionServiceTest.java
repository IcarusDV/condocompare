package com.condocompare.documentos;

import com.condocompare.documentos.service.PdfExtractionService;
import org.junit.jupiter.api.Test;
import java.nio.file.Files;
import java.nio.file.Path;

class PdfExtractionServiceTest {
    @Test
    void testAllianz() throws Exception {
        PdfExtractionService service = new PdfExtractionService();
        Path p = Path.of("..").toAbsolutePath().normalize();
        var files = Files.list(p).filter(f -> f.getFileName().toString().contains("Allianz")).toList();
        if (files.isEmpty()) { System.out.println("Allianz PDF not found"); return; }
        byte[] bytes = Files.readAllBytes(files.get(0));
        System.out.println("File: " + files.get(0).getFileName() + " (" + bytes.length + " bytes)");
        String text = service.extractText(bytes);
        System.out.println("Text: " + (text == null ? "NULL" : text.length() + " chars"));
        if (text != null && !text.isBlank()) {
            System.out.println("--- First 2000 chars ---");
            System.out.println(text.substring(0, Math.min(text.length(), 2000)));
        }
    }
}
