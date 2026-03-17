package com.condocompare.documentos.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ComparacaoResumoDTO(
    UUID menorPrecoId,
    String menorPrecoSeguradora,
    BigDecimal menorPreco,
    UUID maiorCoberturaId,
    String maiorCoberturaSeguradora,
    BigDecimal maiorValorCobertura,
    List<String> coberturasComuns,
    Map<UUID, List<String>> coberturasExclusivas,
    List<RecomendacaoDTO> recomendacoes
) {}
