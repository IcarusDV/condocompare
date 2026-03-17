package com.condocompare.ia.controller;

import com.condocompare.ia.dto.*;
import com.condocompare.ia.service.IAService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/ia")
@RequiredArgsConstructor
@Tag(name = "IA", description = "Inteligência Artificial - Assistente e Análises")
@SecurityRequirement(name = "bearerAuth")
public class IAController {

    private final IAService iaService;

    @PostMapping("/chat")
    @Operation(summary = "Chat com assistente IA",
               description = "Envia mensagem para o assistente de IA especializado em seguros")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(iaService.chat(request));
    }

    @PostMapping("/explain-coverage")
    @Operation(summary = "Explicar cobertura",
               description = "Obtém explicação detalhada sobre uma cobertura de seguro")
    public ResponseEntity<ExplainCoverageResponse> explainCoverage(
            @RequestParam String cobertura,
            @RequestParam(required = false) String seguradora
    ) {
        return ResponseEntity.ok(iaService.explainCoverage(cobertura, seguradora));
    }

    @PostMapping("/compare-terms")
    @Operation(summary = "Comparar termos",
               description = "Compara dois termos de seguro e explica as diferenças")
    public ResponseEntity<CompareTermsResponse> compareTerms(
            @RequestParam String termo1,
            @RequestParam String termo2
    ) {
        return ResponseEntity.ok(iaService.compareTerms(termo1, termo2));
    }

    @PostMapping("/sinistro-help")
    @Operation(summary = "Ajuda para sinistro",
               description = "Obtém orientações sobre como proceder com um sinistro")
    public ResponseEntity<SinistroHelpResponse> sinistroHelp(@Valid @RequestBody SinistroHelpRequest request) {
        return ResponseEntity.ok(iaService.getSinistroHelp(request));
    }

    @PostMapping("/analyze-comparacao")
    @Operation(summary = "Analisar comparação de orçamentos",
               description = "Gera análise textual comparando múltiplos orçamentos de seguro")
    public ResponseEntity<ComparacaoAnaliseResponse> analyzeComparacao(
            @Valid @RequestBody ComparacaoAnaliseRequest request
    ) {
        return ResponseEntity.ok(iaService.analyzeComparacao(request));
    }

    @PostMapping(value = "/extract-document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Extrair dados de documento",
               description = "Extrai dados estruturados de um documento PDF de seguro")
    public ResponseEntity<DocumentExtractResponse> extractDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "orcamento") String tipo,
            @RequestParam(required = false) UUID condominioId
    ) {
        return ResponseEntity.ok(iaService.extractDocument(file, tipo, condominioId));
    }

    @GetMapping("/health")
    @Operation(summary = "Verificar saúde do serviço de IA",
               description = "Verifica se o serviço de IA está disponível")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        boolean healthy = iaService.isServiceHealthy();
        return ResponseEntity.ok(Map.of(
            "service", "ia-service",
            "status", healthy ? "healthy" : "unhealthy",
            "available", healthy
        ));
    }
}
