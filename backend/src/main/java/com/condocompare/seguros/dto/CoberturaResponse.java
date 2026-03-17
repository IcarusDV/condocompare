package com.condocompare.seguros.dto;

import com.condocompare.seguros.entity.TipoCobertura;

import java.math.BigDecimal;
import java.util.UUID;

public record CoberturaResponse(
    UUID id,
    TipoCobertura tipo,
    String descricao,
    BigDecimal limiteMaximo,
    BigDecimal franquia,
    BigDecimal franquiaPercentual,
    Integer carenciaDias,
    String condicoesEspeciais,
    String exclusoes,
    boolean contratada,
    boolean obrigatoria,
    boolean recomendada
) {}
