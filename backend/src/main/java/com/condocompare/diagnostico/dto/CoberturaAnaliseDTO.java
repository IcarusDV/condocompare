package com.condocompare.diagnostico.dto;

import com.condocompare.seguros.entity.TipoCobertura;

import java.math.BigDecimal;

public record CoberturaAnaliseDTO(
    TipoCobertura tipo,
    String nome,
    boolean contratada,
    boolean obrigatoria,
    boolean recomendada,
    BigDecimal limiteAtual,
    BigDecimal limiteRecomendado,
    BigDecimal franquiaAtual,
    String statusLimite,
    String observacao
) {
    public enum StatusLimite {
        ADEQUADO,
        ABAIXO_RECOMENDADO,
        MUITO_ABAIXO,
        NAO_CONTRATADA
    }
}
