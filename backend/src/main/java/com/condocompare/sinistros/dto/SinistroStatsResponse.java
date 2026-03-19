package com.condocompare.sinistros.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record SinistroStatsResponse(
    long total,
    long abertos,
    long emAnalise,
    long aprovados,
    long negados,
    long pagos,
    long cancelados,
    BigDecimal totalPrejuizo,
    BigDecimal totalIndenizado,
    double tempoMedioResolucaoDias,
    double taxaAprovacao,
    double taxaNegacao,
    List<Map<String, Object>> sinistrosPorMes,
    Map<String, Long> porStatus
) {}
