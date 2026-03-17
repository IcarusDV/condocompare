package com.condocompare.seguros.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateSeguradoraRequest(
    @NotBlank(message = "Nome é obrigatório")
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
    List<String> iaConhecimento
) {}
