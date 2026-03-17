package com.condocompare.documentos.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record CoberturaDTO(
    @NotBlank(message = "Nome da cobertura é obrigatório")
    String nome,
    BigDecimal valorLimite,
    BigDecimal franquia,
    boolean incluido
) {}
