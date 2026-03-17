package com.condocompare.billing.controller;

import com.condocompare.billing.dto.*;
import com.condocompare.billing.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/billing")
@RequiredArgsConstructor
@Tag(name = "Billing", description = "Planos e Assinaturas")
public class BillingController {

    private final BillingService billingService;

    // ===== Planos (publico) =====

    @GetMapping("/planos")
    @Operation(summary = "Listar planos disponiveis")
    public ResponseEntity<List<PlanoResponse>> listPlanos() {
        return ResponseEntity.ok(billingService.listPlanos());
    }

    @GetMapping("/planos/{id}")
    @Operation(summary = "Buscar plano por ID")
    public ResponseEntity<PlanoResponse> getPlano(@PathVariable UUID id) {
        return ResponseEntity.ok(billingService.getPlano(id));
    }

    // ===== Assinaturas (autenticado) =====

    @PostMapping("/assinaturas")
    @Operation(summary = "Criar nova assinatura")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<AssinaturaResponse> createAssinatura(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CreateAssinaturaRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(billingService.createAssinatura(userId, request));
    }

    @GetMapping("/assinaturas/ativa")
    @Operation(summary = "Buscar assinatura ativa do usuario")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<AssinaturaResponse> getAssinaturaAtiva(
            @RequestHeader("X-User-Id") UUID userId
    ) {
        AssinaturaResponse response = billingService.getAssinaturaAtiva(userId);
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assinaturas/historico")
    @Operation(summary = "Historico de assinaturas do usuario")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<AssinaturaResponse>> getHistorico(
            @RequestHeader("X-User-Id") UUID userId
    ) {
        return ResponseEntity.ok(billingService.getHistorico(userId));
    }

    @PostMapping("/assinaturas/cancelar")
    @Operation(summary = "Cancelar assinatura ativa")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<AssinaturaResponse> cancelarAssinatura(
            @RequestHeader("X-User-Id") UUID userId
    ) {
        return ResponseEntity.ok(billingService.cancelarAssinatura(userId));
    }
}
