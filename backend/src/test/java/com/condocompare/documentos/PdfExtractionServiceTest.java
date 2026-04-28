package com.condocompare.documentos;

import com.condocompare.documentos.service.PdfExtractionService;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

class PdfExtractionServiceTest {

    @Test
    void testAllianz() throws Exception {
        PdfExtractionService service = new PdfExtractionService();
        Path p = Path.of("..").toAbsolutePath().normalize();
        var files = Files.list(p).filter(f -> f.getFileName().toString().contains("Allianz")).toList();
        if (files.isEmpty()) {
            System.out.println("Allianz PDF not found");
            return;
        }
        byte[] bytes = Files.readAllBytes(files.get(0));
        System.out.println("File: " + files.get(0).getFileName() + " (" + bytes.length + " bytes)");
        String text = service.extractText(bytes);
        System.out.println("Text: " + (text == null ? "NULL" : text.length() + " chars"));
        if (text != null && !text.isBlank()) {
            System.out.println("--- First 2000 chars ---");
            System.out.println(text.substring(0, Math.min(text.length(), 2000)));
        }
    }

    /**
     * Roda extração completa em TODOS os PDFs de orçamento na raiz do projeto.
     * Foco: valorPremio, formaPagamento, coberturas e seguradoraNome.
     */
    @Test
    void extracaoCompletaTodosOsOrcamentos() throws Exception {
        PdfExtractionService service = new PdfExtractionService();
        Path projectRoot = Path.of("..").toAbsolutePath().normalize();

        var pdfs = Files.list(projectRoot)
            .filter(f -> f.getFileName().toString().toLowerCase().endsWith(".pdf"))
            .sorted()
            .toList();

        System.out.println("\n========== EXTRAÇÃO COMPLETA DE ORÇAMENTOS ==========");
        for (Path pdf : pdfs) {
            var files = List.of(pdf);
            byte[] bytes = Files.readAllBytes(files.get(0));
            String text = service.extractText(bytes);
            if (text == null) {
                System.out.println("\n[" + pdf.getFileName() + "] FALHA ao extrair texto");
                continue;
            }

            Map<String, Object> dados = service.extractData(text, "ORCAMENTO", files.get(0).getFileName().toString());

            System.out.println("\n=== " + files.get(0).getFileName() + " ===");
            System.out.println("Texto: " + text.length() + " chars");
            System.out.println("seguradoraNome   = " + dados.get("seguradoraNome"));
            System.out.println("valorPremio      = " + dados.get("valorPremio"));
            System.out.println("formaPagamento   = " + dados.get("formaPagamento"));
            System.out.println("vigenciaInicio   = " + dados.get("dataVigenciaInicio"));
            System.out.println("vigenciaFim      = " + dados.get("dataVigenciaFim"));
            System.out.println("isTotal          = " + dados.get("importanciaSeguradaTotal"));
            Object coberturas = dados.get("coberturas");
            if (coberturas instanceof List<?> cobs) {
                System.out.println("coberturas       = " + cobs.size() + " itens");
                for (Object c : cobs) {
                    System.out.println("  - " + c);
                }
            } else {
                System.out.println("coberturas       = (vazio)");
            }
        }
        System.out.println("\n========== FIM ==========\n");
    }
}
