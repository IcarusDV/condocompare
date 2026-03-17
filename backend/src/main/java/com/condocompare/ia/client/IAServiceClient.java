package com.condocompare.ia.client;

import com.condocompare.ia.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class IAServiceClient {

    private final WebClient iaServiceWebClient;
    private final CircuitBreaker circuitBreaker;

    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(60);

    public IAServiceClient(WebClient iaServiceWebClient) {
        this.iaServiceWebClient = iaServiceWebClient;
        this.circuitBreaker = new CircuitBreaker("ia-service", 5, 30_000);
    }

    public ChatResponse chat(ChatRequest request) {
        return circuitBreaker.execute(
            () -> {
                try {
                    Map<String, Object> body = Map.of(
                        "message", request.message(),
                        "condominio_id", request.condominioId() != null ? request.condominioId().toString() : "",
                        "history", request.history().stream()
                            .map(m -> Map.of("role", m.role(), "content", m.content()))
                            .toList(),
                        "context_type", request.contextType()
                    );

                    return iaServiceWebClient.post()
                        .uri("/chat/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(ChatResponse.class)
                        .timeout(DEFAULT_TIMEOUT)
                        .block();
                } catch (WebClientResponseException e) {
                    log.error("Erro ao chamar chat da IA: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
                    throw new RuntimeException("Erro ao comunicar com serviço de IA: " + e.getMessage());
                } catch (Exception e) {
                    log.error("Erro inesperado ao chamar chat da IA", e);
                    throw new RuntimeException("Erro ao comunicar com serviço de IA: " + e.getMessage());
                }
            },
            () -> new ChatResponse("Serviço de IA temporariamente indisponível. Tente novamente em alguns instantes.", List.of(), false)
        );
    }

    public ExplainCoverageResponse explainCoverage(String cobertura, String seguradora) {
        try {
            return iaServiceWebClient.post()
                .uri(uriBuilder -> uriBuilder
                    .path("/chat/explain-coverage")
                    .queryParam("cobertura", cobertura)
                    .queryParamIfPresent("seguradora", java.util.Optional.ofNullable(seguradora))
                    .build())
                .retrieve()
                .bodyToMono(ExplainCoverageResponse.class)
                .timeout(DEFAULT_TIMEOUT)
                .block();
        } catch (WebClientResponseException e) {
            log.error("Erro ao explicar cobertura: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Erro ao comunicar com serviço de IA: " + e.getMessage());
        }
    }

    public CompareTermsResponse compareTerms(String termo1, String termo2) {
        try {
            return iaServiceWebClient.post()
                .uri(uriBuilder -> uriBuilder
                    .path("/chat/compare-terms")
                    .queryParam("termo1", termo1)
                    .queryParam("termo2", termo2)
                    .build())
                .retrieve()
                .bodyToMono(CompareTermsResponse.class)
                .timeout(DEFAULT_TIMEOUT)
                .block();
        } catch (WebClientResponseException e) {
            log.error("Erro ao comparar termos: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Erro ao comunicar com serviço de IA: " + e.getMessage());
        }
    }

    public SinistroHelpResponse getSinistroHelp(SinistroHelpRequest request) {
        try {
            Map<String, Object> body = Map.of(
                "tipo", request.tipo(),
                "descricao", request.descricao() != null ? request.descricao() : ""
            );

            return iaServiceWebClient.post()
                .uri("/chat/sinistro-help")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(SinistroHelpResponse.class)
                .timeout(DEFAULT_TIMEOUT)
                .block();
        } catch (WebClientResponseException e) {
            log.error("Erro ao obter ajuda sinistro: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Erro ao comunicar com serviço de IA: " + e.getMessage());
        }
    }

    public ComparacaoAnaliseResponse analyzeComparacao(ComparacaoAnaliseRequest request) {
        try {
            Map<String, Object> body = Map.of(
                "orcamentos", request.orcamentos().stream()
                    .map(o -> Map.of(
                        "seguradora", o.seguradora(),
                        "valorPremio", o.valorPremio(),
                        "coberturas", o.coberturas().stream()
                            .map(c -> Map.of(
                                "nome", c.nome(),
                                "valorLimite", c.valorLimite() != null ? c.valorLimite() : 0,
                                "franquia", c.franquia() != null ? c.franquia() : 0,
                                "incluido", c.incluido()
                            ))
                            .toList(),
                        "formaPagamento", o.formaPagamento() != null ? o.formaPagamento() : "",
                        "descontos", o.descontos() != null ? o.descontos() : 0
                    ))
                    .toList()
            );

            return iaServiceWebClient.post()
                .uri("/chat/analyze-comparacao")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(ComparacaoAnaliseResponse.class)
                .timeout(Duration.ofSeconds(90))
                .block();
        } catch (WebClientResponseException e) {
            log.error("Erro ao analisar comparação: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Erro ao comunicar com serviço de IA: " + e.getMessage());
        }
    }

    public DocumentExtractResponse extractDocument(byte[] fileContent, String filename, String tipo, UUID condominioId) {
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(fileContent) {
                @Override
                public String getFilename() {
                    return filename;
                }
            }).contentType(MediaType.APPLICATION_PDF);
            builder.part("tipo", tipo);
            if (condominioId != null) {
                builder.part("condominio_id", condominioId.toString());
            }

            return iaServiceWebClient.post()
                .uri("/documents/extract")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(DocumentExtractResponse.class)
                .timeout(Duration.ofSeconds(120))
                .block();
        } catch (WebClientResponseException e) {
            log.error("Erro ao extrair documento: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Erro ao comunicar com serviço de IA: " + e.getMessage());
        }
    }

    public String generateLaudo(Map<String, Object> laudoRequest) {
        try {
            Map<String, Object> response = iaServiceWebClient.post()
                .uri("/vistoria/generate-laudo")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(laudoRequest)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .timeout(Duration.ofSeconds(120))
                .block();

            if (response != null && Boolean.TRUE.equals(response.get("success"))) {
                return (String) response.get("laudo_texto");
            }
            return null;
        } catch (WebClientResponseException e) {
            log.error("Erro ao gerar laudo: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Erro ao gerar laudo com IA: " + e.getMessage());
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar laudo", e);
            return null;
        }
    }

    public String generateReport(Map<String, Object> reportRequest) {
        try {
            Map<String, Object> response = iaServiceWebClient.post()
                .uri("/reports/diagnostico")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(reportRequest)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .timeout(Duration.ofSeconds(120))
                .block();

            if (response != null && Boolean.TRUE.equals(response.get("success"))) {
                return (String) response.get("relatorio_markdown");
            }
            return null;
        } catch (Exception e) {
            log.error("Erro ao gerar relatorio: {}", e.getMessage());
            return null;
        }
    }

    public boolean checkHealth() {
        if (circuitBreaker.isOpen()) {
            return false;
        }
        try {
            Map<String, String> response = iaServiceWebClient.get()
                .uri("/health")
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(5))
                .block();
            return response != null && "healthy".equals(response.get("status"));
        } catch (Exception e) {
            log.warn("IA Service health check failed: {}", e.getMessage());
            return false;
        }
    }
}
