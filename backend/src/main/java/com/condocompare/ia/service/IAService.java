package com.condocompare.ia.service;

import com.condocompare.documentos.service.MinioService;
import com.condocompare.documentos.service.PdfExtractionService;
import com.condocompare.ia.client.IAServiceClient;
import com.condocompare.ia.dto.*;
import com.condocompare.seguros.entity.Seguradora;
import com.condocompare.seguros.repository.SeguradoraRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IAService {

    /** Limite de caracteres por trecho de Cond. Gerais injetado no contexto. */
    private static final int MAX_CHARS_POR_CG = 5000;
    /** Cache em memória do texto extraído das CG (objectKey -> texto). */
    private final Map<String, String> cgTextCache = new ConcurrentHashMap<>();

    private final IAServiceClient iaServiceClient;
    private final SeguradoraRepository seguradoraRepository;
    private final MinioService minioService;
    private final PdfExtractionService pdfExtractionService;

    public ChatResponse chat(ChatRequest request) {
        log.info("Processando chat - contexto: {}", request.contextType());
        ChatRequest enriched = enriquecerComContextoSeguradoras(request);
        return iaServiceClient.chat(enriched);
    }

    /**
     * Anexa contexto sobre seguradoras cadastradas. Se o usuário menciona uma seguradora
     * específica que tem Condições Gerais (PDF) cadastradas, baixa, extrai texto e
     * injeta no prompt — RAG real.
     */
    private ChatRequest enriquecerComContextoSeguradoras(ChatRequest request) {
        try {
            List<Seguradora> seguradoras = seguradoraRepository.findByActiveTrue();
            if (seguradoras.isEmpty()) return request;

            String userMessage = request.message();
            String userMessageNormalizado = normalizar(userMessage);

            // 1. Lista resumida de TODAS as seguradoras vinculadas
            String resumo = seguradoras.stream()
                .map(s -> {
                    StringBuilder sb = new StringBuilder("- ").append(s.getNome());
                    if (s.getWebsite() != null && !s.getWebsite().isBlank()) {
                        sb.append(" (site: ").append(s.getWebsite()).append(")");
                    }
                    if (s.getCondicoesGeraisUrl() != null && !s.getCondicoesGeraisUrl().isBlank()) {
                        sb.append(" — Condições Gerais cadastradas");
                    }
                    return sb.toString();
                })
                .collect(Collectors.joining("\n"));

            // 2. Detecta seguradoras mencionadas e injeta texto das CG
            List<String> trechosCG = new ArrayList<>();
            for (Seguradora s : seguradoras) {
                if (s.getCondicoesGeraisUrl() == null || s.getCondicoesGeraisUrl().isBlank()) continue;
                if (!mencionaSeguradora(userMessageNormalizado, s.getNome())) continue;
                String texto = lerCondicoesGerais(s);
                if (texto == null || texto.isBlank()) continue;
                String trecho = texto.length() > MAX_CHARS_POR_CG
                    ? texto.substring(0, MAX_CHARS_POR_CG) + "\n[...conteúdo truncado...]"
                    : texto;
                trechosCG.add("=== Condições Gerais — " + s.getNome() + " ===\n" + trecho);
            }

            StringBuilder enriched = new StringBuilder();
            enriched.append("[CONTEXTO INTERNO — Seguradoras vinculadas ao sistema CondoCompare]\n");
            enriched.append(resumo);
            if (!trechosCG.isEmpty()) {
                enriched.append("\n\n[CONDIÇÕES GERAIS REAIS — use estes trechos como fonte primária ao responder sobre as cias citadas pelo usuário]\n");
                enriched.append(String.join("\n\n", trechosCG));
            }
            enriched.append("\n\n[PERGUNTA DO USUÁRIO]\n").append(userMessage);

            return new ChatRequest(enriched.toString(), request.condominioId(), request.history(), request.contextType());
        } catch (Exception e) {
            log.warn("Falha ao enriquecer chat com contexto de seguradoras: {}", e.getMessage());
            return request;
        }
    }

    /** Normaliza para comparação: minúsculas + sem acentos. */
    private String normalizar(String s) {
        if (s == null) return "";
        String semAcento = Normalizer.normalize(s, Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return semAcento.toLowerCase(Locale.ROOT);
    }

    private boolean mencionaSeguradora(String mensagemNormalizada, String nomeSeguradora) {
        if (nomeSeguradora == null) return false;
        String alvo = normalizar(nomeSeguradora);
        if (alvo.isBlank()) return false;
        // Match no nome inteiro OU na primeira palavra (ex: "Tokio Marine" -> "tokio")
        if (mensagemNormalizada.contains(alvo)) return true;
        String primeira = alvo.split("\\s+")[0];
        return primeira.length() >= 4 && mensagemNormalizada.contains(primeira);
    }

    /** Baixa PDF das Cond. Gerais e retorna texto extraído (com cache em memória). */
    private String lerCondicoesGerais(Seguradora s) {
        String key = s.getCondicoesGeraisUrl();
        if (key == null) return null;
        return cgTextCache.computeIfAbsent(key, k -> {
            try (InputStream is = minioService.downloadFile(k)) {
                byte[] bytes = is.readAllBytes();
                return pdfExtractionService.extractText(bytes);
            } catch (Exception e) {
                log.warn("Falha ao ler Cond. Gerais de {}: {}", s.getNome(), e.getMessage());
                return null;
            }
        });
    }

    public ExplainCoverageResponse explainCoverage(String cobertura, String seguradora) {
        log.info("Explicando cobertura: {} - seguradora: {}", cobertura, seguradora);
        return iaServiceClient.explainCoverage(cobertura, seguradora);
    }

    public CompareTermsResponse compareTerms(String termo1, String termo2) {
        log.info("Comparando termos: {} vs {}", termo1, termo2);
        return iaServiceClient.compareTerms(termo1, termo2);
    }

    public SinistroHelpResponse getSinistroHelp(SinistroHelpRequest request) {
        log.info("Obtendo ajuda para sinistro tipo: {}", request.tipo());
        return iaServiceClient.getSinistroHelp(request);
    }

    public ComparacaoAnaliseResponse analyzeComparacao(ComparacaoAnaliseRequest request) {
        log.info("Analisando comparação com {} orçamentos", request.orcamentos().size());
        return iaServiceClient.analyzeComparacao(request);
    }

    public DocumentExtractResponse extractDocument(MultipartFile file, String tipo, UUID condominioId) {
        log.info("Extraindo documento: {} - tipo: {}", file.getOriginalFilename(), tipo);
        try {
            return iaServiceClient.extractDocument(
                file.getBytes(),
                file.getOriginalFilename(),
                tipo,
                condominioId
            );
        } catch (IOException e) {
            log.error("Erro ao ler arquivo", e);
            throw new RuntimeException("Erro ao processar arquivo: " + e.getMessage());
        }
    }

    public String generateLaudo(Map<String, Object> laudoRequest) {
        log.info("Gerando laudo com IA");
        return iaServiceClient.generateLaudo(laudoRequest);
    }

    public String generateReport(Map<String, Object> reportRequest) {
        log.info("Gerando relatorio com IA");
        return iaServiceClient.generateReport(reportRequest);
    }

    public boolean isServiceHealthy() {
        return iaServiceClient.checkHealth();
    }
}
