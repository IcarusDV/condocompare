package com.condocompare.ia.dto;

import java.math.BigDecimal;

public record CoberturaItemDTO(
    String nome,
    BigDecimal valorLimite,
    BigDecimal franquia,
    boolean incluido
) {}
