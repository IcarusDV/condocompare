package com.condocompare.sinistros.dto;

import jakarta.validation.constraints.NotBlank;

public record AddHistoricoRequest(
    @NotBlank(message = "Descrição é obrigatória")
    String descricao
) {}
