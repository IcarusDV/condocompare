package com.condocompare.diagnostico.dto;

import java.math.BigDecimal;

public record RecomendacaoDTO(
    String tipo,
    String prioridade,
    String titulo,
    String descricao,
    String acao,
    BigDecimal impactoFinanceiro,
    String justificativa
) {
    public enum Tipo {
        COBERTURA_FALTANTE,
        LIMITE_INSUFICIENTE,
        FRANQUIA_ALTA,
        CONDICAO_ESPECIAL,
        MELHORIA,
        ALERTA
    }

    public enum Prioridade {
        CRITICA,
        ALTA,
        MEDIA,
        BAIXA
    }
}
