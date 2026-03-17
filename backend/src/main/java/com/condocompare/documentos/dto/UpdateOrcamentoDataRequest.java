package com.condocompare.documentos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateOrcamentoDataRequest(
    @NotBlank(message = "Nome da seguradora é obrigatório")
    String seguradoraNome,

    @NotNull(message = "Valor do prêmio é obrigatório")
    BigDecimal valorPremio,

    @NotNull(message = "Data de início da vigência é obrigatória")
    LocalDate dataVigenciaInicio,

    @NotNull(message = "Data de fim da vigência é obrigatória")
    LocalDate dataVigenciaFim,

    @Valid
    DadosOrcamentoDTO dadosOrcamento,

    String observacoes
) {}
