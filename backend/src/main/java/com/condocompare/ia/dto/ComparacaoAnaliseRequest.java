package com.condocompare.ia.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ComparacaoAnaliseRequest(
    @NotEmpty(message = "Pelo menos um orçamento é obrigatório")
    List<OrcamentoItemDTO> orcamentos
) {}
