package com.condocompare.ia.service;

import com.condocompare.ia.client.IAServiceClient;
import com.condocompare.ia.dto.*;
import com.condocompare.seguros.entity.Seguradora;
import com.condocompare.seguros.repository.SeguradoraRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IAService {

    private final IAServiceClient iaServiceClient;
    private final SeguradoraRepository seguradoraRepository;

    public ChatResponse chat(ChatRequest request) {
        log.info("Processando chat - contexto: {}", request.contextType());
        ChatRequest enriched = enriquecerComContextoSeguradoras(request);
        return iaServiceClient.chat(enriched);
    }

    /**
     * Anexa um bloco de contexto descrevendo as seguradoras cadastradas no sistema
     * (nome, site, e se tem Condições Gerais disponíveis) para que o Assistente IA
     * possa priorizar essas cias em comparações e perguntas de mercado.
     */
    private ChatRequest enriquecerComContextoSeguradoras(ChatRequest request) {
        try {
            List<Seguradora> seguradoras = seguradoraRepository.findByActiveTrue();
            if (seguradoras.isEmpty()) return request;

            String contexto = seguradoras.stream()
                .map(s -> {
                    StringBuilder sb = new StringBuilder("- ").append(s.getNome());
                    if (s.getWebsite() != null && !s.getWebsite().isBlank()) {
                        sb.append(" (site: ").append(s.getWebsite()).append(")");
                    }
                    if (s.getCondicoesGeraisUrl() != null && !s.getCondicoesGeraisUrl().isBlank()) {
                        sb.append(" — Condições Gerais cadastradas no sistema");
                    }
                    return sb.toString();
                })
                .collect(Collectors.joining("\n"));

            String enriched = "[CONTEXTO INTERNO — Seguradoras vinculadas ao sistema CondoCompare]\n"
                + contexto
                + "\n\n[PERGUNTA DO USUÁRIO]\n"
                + request.message();
            return new ChatRequest(enriched, request.condominioId(), request.history(), request.contextType());
        } catch (Exception e) {
            log.warn("Falha ao enriquecer chat com contexto de seguradoras: {}", e.getMessage());
            return request;
        }
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
