package com.condocompare.seguros.dto;

import com.condocompare.seguros.entity.StatusApolice;

import java.util.UUID;

public record ApoliceFilter(
    String search,
    UUID condominioId,
    UUID seguradoraId,
    StatusApolice status,
    Boolean vigente,
    Boolean vencendo,
    Integer diasVencimento
) {}
