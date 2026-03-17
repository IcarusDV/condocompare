package com.condocompare.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardMetricsDTO(
    // Counts
    long totalCondominios,
    long totalDocumentos,
    long totalVistorias,
    long totalSinistros,
    long totalApolices,
    long totalOrcamentos,

    // Policy expiration
    long apolicesVencendo30dias,
    List<ApoliceVencendoDTO> proximasApolicesVencer,

    // Vistorias
    long vistoriasAgendadas,
    long vistoriasConcluidas,

    // Sinistros
    long sinistrosAbertos,
    long sinistrosEmAnalise,
    BigDecimal valorTotalPrejuizos,
    BigDecimal valorTotalIndenizado,

    // Notifications
    long notificacoesNaoLidas
) {}
