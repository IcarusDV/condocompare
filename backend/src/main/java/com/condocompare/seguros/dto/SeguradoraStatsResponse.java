package com.condocompare.seguros.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record SeguradoraStatsResponse(
    UUID seguradoraId,
    String seguradoraNome,
    long totalApolices,
    long apolicesVigentes,
    long apolicesVencidas,
    BigDecimal premioTotalMedio,
    BigDecimal importanciaSeguradaMedia,
    long totalCoberturas,
    long totalSinistros,
    BigDecimal totalPrejuizoSinistros,
    BigDecimal totalIndenizado,
    long totalCondominios
) {}
