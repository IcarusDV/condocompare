package com.condocompare.ia.dto;

import jakarta.validation.constraints.NotBlank;

public record SinistroHelpRequest(
    @NotBlank(message = "Tipo é obrigatório")
    String tipo,
    String descricao
) {}
