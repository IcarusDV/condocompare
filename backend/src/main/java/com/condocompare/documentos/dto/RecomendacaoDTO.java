package com.condocompare.documentos.dto;

import java.util.UUID;

public record RecomendacaoDTO(
    String tipo,  // "MELHOR_CUSTO_BENEFICIO", "MAIOR_COBERTURA", "MENOR_PRECO"
    UUID orcamentoId,
    String seguradora,
    String justificativa
) {}
