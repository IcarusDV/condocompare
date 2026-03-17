package com.condocompare.seguros.dto;

import com.condocompare.seguros.entity.TipoCobertura;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateCoberturaRequest(
    @NotNull(message = "Tipo é obrigatório")
    TipoCobertura tipo,

    @NotBlank(message = "Descrição é obrigatória")
    String descricao,

    BigDecimal limiteMaximo,
    BigDecimal franquia,
    BigDecimal franquiaPercentual,
    Integer carenciaDias,
    String condicoesEspeciais,
    String exclusoes,
    Boolean contratada,
    Boolean obrigatoria,
    Boolean recomendada
) {}
