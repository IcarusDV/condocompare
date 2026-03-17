package com.condocompare.diagnostico.dto;

import java.math.BigDecimal;
import java.util.List;

public record ScoreCoberturaDTO(
    int scoreGeral,
    String classificacao,
    int coberturasContratadas,
    int coberturasRecomendadas,
    int coberturasObrigatoriasFaltando,
    BigDecimal importanciaSeguradaTotal,
    BigDecimal valorRecomendado,
    BigDecimal gapValor,
    List<ItemScoreDTO> detalhamento,
    List<String> alertas
) {
    public static String getClassificacao(int score) {
        if (score >= 90) return "EXCELENTE";
        if (score >= 75) return "BOM";
        if (score >= 60) return "REGULAR";
        if (score >= 40) return "INSUFICIENTE";
        return "CRITICO";
    }
}
