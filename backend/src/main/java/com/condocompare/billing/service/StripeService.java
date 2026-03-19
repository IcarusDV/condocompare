package com.condocompare.billing.service;

import com.condocompare.billing.entity.Assinatura;
import com.condocompare.billing.entity.Plano;
import com.condocompare.billing.repository.AssinaturaRepository;
import com.condocompare.billing.repository.PlanoRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripeService {

    private final PlanoRepository planoRepository;
    private final AssinaturaRepository assinaturaRepository;

    @Value("${stripe.api-key:}")
    private String apiKey;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @Value("${stripe.success-url:http://localhost:3000/dashboard/planos?success=true}")
    private String successUrl;

    @Value("${stripe.cancel-url:http://localhost:3000/dashboard/planos?canceled=true}")
    private String cancelUrl;

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.isBlank()) {
            Stripe.apiKey = apiKey;
            log.info("Stripe API initialized");
        } else {
            log.warn("Stripe API key not configured - payment processing disabled");
        }
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String createCheckoutSession(UUID userId, UUID planoId, String tipoPagamento) throws StripeException {
        Plano plano = planoRepository.findById(planoId)
                .orElseThrow(() -> new EntityNotFoundException("Plano nao encontrado"));

        BigDecimal valor = "ANUAL".equals(tipoPagamento) && plano.getPrecoAnual() != null
                ? plano.getPrecoAnual()
                : plano.getPrecoMensal();

        // Stripe expects amount in cents
        long amountInCents = valor.multiply(BigDecimal.valueOf(100)).longValue();

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "&session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(cancelUrl)
                .putMetadata("userId", userId.toString())
                .putMetadata("planoId", planoId.toString())
                .putMetadata("tipoPagamento", tipoPagamento)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("brl")
                                                .setUnitAmount(amountInCents)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("CondoCompare - " + plano.getNome())
                                                                .setDescription(plano.getDescricao())
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                );

        Session session = Session.create(builder.build());
        return session.getUrl();
    }

    @Transactional
    public void handleWebhookEvent(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.error("Webhook signature verification failed: {}", e.getMessage());
            throw new RuntimeException("Invalid webhook signature");
        }

        log.info("Stripe webhook received: {}", event.getType());

        if ("checkout.session.completed".equals(event.getType())) {
            handleCheckoutCompleted(event);
        } else if ("payment_intent.payment_failed".equals(event.getType())) {
            log.warn("Payment failed event received");
        }
    }

    private void handleCheckoutCompleted(Event event) {
        Session session = (Session) event.getDataObjectDeserializer()
                .getObject().orElse(null);

        if (session == null) {
            log.error("Could not deserialize checkout session");
            return;
        }

        String userId = session.getMetadata().get("userId");
        String planoId = session.getMetadata().get("planoId");
        String tipoPagamento = session.getMetadata().get("tipoPagamento");

        if (userId == null || planoId == null) {
            log.error("Missing metadata in checkout session");
            return;
        }

        UUID userUUID = UUID.fromString(userId);
        UUID planoUUID = UUID.fromString(planoId);

        Plano plano = planoRepository.findById(planoUUID).orElse(null);
        if (plano == null) {
            log.error("Plano not found: {}", planoId);
            return;
        }

        // Cancel existing active subscription
        assinaturaRepository.findByUserIdAndStatus(userUUID, "ATIVA")
                .ifPresent(existing -> {
                    existing.setStatus("CANCELADA");
                    existing.setDataCancelamento(LocalDate.now());
                    assinaturaRepository.save(existing);
                });

        String tipo = tipoPagamento != null ? tipoPagamento : "MENSAL";
        BigDecimal valor = "ANUAL".equals(tipo) && plano.getPrecoAnual() != null
                ? plano.getPrecoAnual()
                : plano.getPrecoMensal();

        LocalDate dataInicio = LocalDate.now();
        LocalDate dataFim = "ANUAL".equals(tipo)
                ? dataInicio.plusYears(1)
                : dataInicio.plusMonths(1);

        Assinatura assinatura = Assinatura.builder()
                .userId(userUUID)
                .planoId(planoUUID)
                .status("ATIVA")
                .dataInicio(dataInicio)
                .dataFim(dataFim)
                .tipoPagamento(tipo)
                .valor(valor)
                .stripeSessionId(session.getId())
                .stripePaymentIntentId(session.getPaymentIntent())
                .build();

        assinaturaRepository.save(assinatura);
        log.info("Assinatura criada via Stripe para user={}, plano={}", userId, plano.getNome());
    }
}
