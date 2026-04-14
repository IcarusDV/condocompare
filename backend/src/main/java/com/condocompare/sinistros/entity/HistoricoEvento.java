package com.condocompare.sinistros.entity;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record HistoricoEvento(
    String data,
    String descricao,
    String usuario
) {}
