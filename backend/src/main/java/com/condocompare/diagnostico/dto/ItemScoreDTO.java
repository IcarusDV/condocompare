package com.condocompare.diagnostico.dto;

import java.math.BigDecimal;

public record ItemScoreDTO(
    String categoria,
    String nome,
    int peso,
    int pontuacao,
    int pontuacaoMaxima,
    boolean contratada,
    BigDecimal limiteAtual,
    BigDecimal limiteRecomendado,
    String observacao
) {}
