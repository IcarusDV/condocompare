package com.condocompare.ia.service;

import com.condocompare.ia.client.IAServiceClient;
import com.condocompare.ia.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IAService {

    private final IAServiceClient iaServiceClient;

    public ChatResponse chat(ChatRequest request) {
        log.info("Processando chat - contexto: {}", request.contextType());
        return iaServiceClient.chat(request);
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
