package com.condocompare.seguros.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SeguradoraResponse(
    UUID id,
    String nome,
    String cnpj,
    String codigoSusep,
    String telefone,
    String email,
    String website,
    String enderecoCompleto,
    String logoUrl,
    String observacoes,
    String descricao,
    List<String> especialidades,
    List<String> regras,
    List<String> iaConhecimento,
    BigDecimal rating,
    Integer totalAvaliacoes,
    String condicoesGeraisUrl,
    String condicoesGeraisNomeArquivo,
    LocalDateTime condicoesGeraisAtualizadoEm
) {}
