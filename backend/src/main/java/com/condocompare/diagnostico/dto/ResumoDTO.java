package com.condocompare.diagnostico.dto;

import java.math.BigDecimal;

public record ResumoDTO(
    int totalCoberturas,
    int coberturasContratadas,
    int coberturasNaoContratadas,
    int recomendacoesCriticas,
    int recomendacoesAltas,
    int recomendacoesMedias,
    int recomendacoesBaixas,
    BigDecimal valorPremioAtual,
    BigDecimal valorEstimadoMelhorias,
    String conclusaoGeral
) {}
