package com.condocompare.diagnostico.dto;

import java.util.List;

public record AnaliseRiscoDTO(
    String nivelRisco,
    int scoreRisco,
    List<FatorRiscoDTO> fatoresRisco,
    List<String> caracteristicasCondominio,
    String observacaoGeral
) {
    public static String getNivelRisco(int score) {
        if (score <= 20) return "MUITO_BAIXO";
        if (score <= 40) return "BAIXO";
        if (score <= 60) return "MODERADO";
        if (score <= 80) return "ALTO";
        return "MUITO_ALTO";
    }
}
