package com.condocompare.billing.controller;

import com.condocompare.billing.dto.*;
import com.condocompare.billing.service.BillingService;
import com.condocompare.billing.service.StripeService;
import com.condocompare.common.security.SecurityUtils;
import com.stripe.exception.StripeException;
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
    private final StripeService stripeService;
    private final SecurityUtils securityUtils;

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
            @Valid @RequestBody CreateAssinaturaRequest request
    ) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(billingService.createAssinatura(userId, request));
    }

    @GetMapping("/assinaturas/ativa")
    @Operation(summary = "Buscar assinatura ativa do usuario")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<AssinaturaResponse> getAssinaturaAtiva() {
        UUID userId = securityUtils.getCurrentUserId();
        AssinaturaResponse response = billingService.getAssinaturaAtiva(userId);
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assinaturas/historico")
    @Operation(summary = "Historico de assinaturas do usuario")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<AssinaturaResponse>> getHistorico() {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(billingService.getHistorico(userId));
    }

    @PostMapping("/assinaturas/cancelar")
    @Operation(summary = "Cancelar assinatura ativa")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<AssinaturaResponse> cancelarAssinatura() {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(billingService.cancelarAssinatura(userId));
    }

    // ===== Stripe Checkout =====

    @PostMapping("/checkout")
    @Operation(summary = "Criar sessao de checkout Stripe")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<CheckoutResponse> createCheckout(
            @Valid @RequestBody CreateCheckoutRequest request
    ) {
        UUID userId = securityUtils.getCurrentUserId();
        if (!stripeService.isConfigured()) {
            // Fallback: create subscription directly without payment
            CreateAssinaturaRequest assinaturaRequest = new CreateAssinaturaRequest(
                request.planoId(), request.tipoPagamento()
            );
            billingService.createAssinatura(userId, assinaturaRequest);
            return ResponseEntity.ok(new CheckoutResponse(null, false));
        }

        try {
            String url = stripeService.createCheckoutSession(userId, request.planoId(), request.tipoPagamento());
            return ResponseEntity.ok(new CheckoutResponse(url, true));
        } catch (StripeException e) {
            throw new RuntimeException("Erro ao criar sessao de checkout: " + e.getMessage());
        }
    }

    @PostMapping("/webhook/stripe")
    @Operation(summary = "Webhook do Stripe")
    public ResponseEntity<String> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader
    ) {
        stripeService.handleWebhookEvent(payload, sigHeader);
        return ResponseEntity.ok("ok");
    }
}
