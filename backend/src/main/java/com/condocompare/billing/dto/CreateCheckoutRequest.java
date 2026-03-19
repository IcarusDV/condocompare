package com.condocompare.billing.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateCheckoutRequest(
    @NotNull UUID planoId,
    String tipoPagamento
) {}
