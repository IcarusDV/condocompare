package com.condocompare.billing.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateAssinaturaRequest(
    @NotNull(message = "Plano e obrigatorio")
    UUID planoId,

    String tipoPagamento // MENSAL ou ANUAL
) {}
