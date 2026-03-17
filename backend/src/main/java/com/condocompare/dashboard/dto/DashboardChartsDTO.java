package com.condocompare.dashboard.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record DashboardChartsDTO(
    List<StatusCount> sinistrosByStatus,
    List<TipoCount> documentosByTipo,
    List<MonthCount> vistoriasByMonth,
    List<SeguradoraCount> topSeguradoras,
    List<ActivityEventDTO> recentActivity
) {
    public record StatusCount(String status, long count) {}
    public record TipoCount(String tipo, long count) {}
    public record MonthCount(String month, long count) {}
    public record SeguradoraCount(String seguradora, long condominios) {}
    public record ActivityEventDTO(
        UUID id,
        String type,
        String title,
        String description,
        LocalDateTime timestamp
    ) {}
}
