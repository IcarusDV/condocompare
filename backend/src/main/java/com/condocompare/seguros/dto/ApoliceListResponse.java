package com.condocompare.seguros.dto;

import com.condocompare.seguros.entity.StatusApolice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ApoliceListResponse(
    UUID id,
    String numeroApolice,
    UUID condominioId,
    String condominioNome,
    String seguradoraNome,
    StatusApolice status,
    LocalDate dataInicio,
    LocalDate dataFim,
    BigDecimal premioTotal,
    BigDecimal importanciaSeguradaTotal,
    int quantidadeCoberturas,
    long diasParaVencimento,
    boolean vigente
) {}
