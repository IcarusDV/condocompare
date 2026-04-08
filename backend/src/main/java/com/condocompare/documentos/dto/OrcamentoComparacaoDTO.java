package com.condocompare.documentos.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record OrcamentoComparacaoDTO(
    UUID id,
    String nome,
    String seguradoraNome,
    BigDecimal valorPremio,
    LocalDate dataVigenciaInicio,
    LocalDate dataVigenciaFim,
    int vigenciaDias,
    List<CoberturaDTO> coberturas,
    List<String> condicoesEspeciais,
    BigDecimal descontos,
    String formaPagamento,
    String observacoes,
    Map<String, Object> dadosExtraidos
) {}
