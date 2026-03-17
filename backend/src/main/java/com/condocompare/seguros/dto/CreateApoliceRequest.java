package com.condocompare.seguros.dto;

import com.condocompare.seguros.entity.StatusApolice;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateApoliceRequest(
    @NotBlank(message = "Número da apólice é obrigatório")
    String numeroApolice,

    @NotNull(message = "Condomínio é obrigatório")
    UUID condominioId,

    @NotNull(message = "Seguradora é obrigatória")
    UUID seguradoraId,

    StatusApolice status,

    @NotNull(message = "Data de início é obrigatória")
    LocalDate dataInicio,

    @NotNull(message = "Data de fim é obrigatória")
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
    List<CreateCoberturaRequest> coberturas
) {}
