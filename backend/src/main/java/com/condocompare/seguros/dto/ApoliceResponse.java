package com.condocompare.seguros.dto;

import com.condocompare.seguros.entity.StatusApolice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ApoliceResponse(
    UUID id,
    String numeroApolice,
    UUID condominioId,
    String condominioNome,
    UUID seguradoraId,
    String seguradoraNome,
    StatusApolice status,
    LocalDate dataInicio,
    LocalDate dataFim,
    BigDecimal premioTotal,
    BigDecimal premioLiquido,
    BigDecimal iof,
    String formaPagamento,
    Integer numeroParcelas,
    BigDecimal valorParcela,
    BigDecimal importanciaSeguradaTotal,
    UUID documentoId,
    UUID propostaId,
    String corretorNome,
    String corretorSusep,
    String corretorTelefone,
    String corretorEmail,
    String observacoes,
    String clausulasEspeciais,
    List<CoberturaResponse> coberturas,
    long diasParaVencimento,
    boolean vigente,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
