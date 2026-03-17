package com.condocompare.diagnostico.dto;

public record FatorRiscoDTO(
    String fator,
    String categoria,
    int impacto,
    String descricao,
    boolean coberto
) {}
