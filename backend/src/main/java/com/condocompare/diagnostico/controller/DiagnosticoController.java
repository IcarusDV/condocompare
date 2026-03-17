package com.condocompare.diagnostico.controller;

import com.condocompare.diagnostico.dto.DiagnosticoCompletoDTO;
import com.condocompare.diagnostico.dto.ScoreCoberturaDTO;
import com.condocompare.diagnostico.service.DiagnosticoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/diagnostico")
@RequiredArgsConstructor
@Tag(name = "Diagnóstico", description = "Análise e diagnóstico de coberturas de seguro")
@SecurityRequirement(name = "bearerAuth")
public class DiagnosticoController {

    private final DiagnosticoService diagnosticoService;

    @GetMapping("/condominio/{condominioId}")
    @Operation(summary = "Gerar diagnóstico completo para um condomínio",
               description = "Analisa a apólice vigente do condomínio e gera diagnóstico com score, análise de risco e recomendações")
    public ResponseEntity<DiagnosticoCompletoDTO> gerarDiagnostico(@PathVariable UUID condominioId) {
        return ResponseEntity.ok(diagnosticoService.gerarDiagnostico(condominioId));
    }

    @GetMapping("/apolice/{apoliceId}")
    @Operation(summary = "Gerar diagnóstico para uma apólice específica",
               description = "Analisa uma apólice específica e gera diagnóstico completo")
    public ResponseEntity<DiagnosticoCompletoDTO> gerarDiagnosticoPorApolice(@PathVariable UUID apoliceId) {
        return ResponseEntity.ok(diagnosticoService.gerarDiagnosticoPorApolice(apoliceId));
    }

    @GetMapping("/score/{condominioId}")
    @Operation(summary = "Calcular score de cobertura",
               description = "Calcula apenas o score de cobertura para o condomínio")
    public ResponseEntity<ScoreCoberturaDTO> calcularScore(@PathVariable UUID condominioId) {
        return ResponseEntity.ok(diagnosticoService.calcularScore(condominioId));
    }
}
