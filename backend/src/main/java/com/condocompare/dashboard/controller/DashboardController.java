package com.condocompare.dashboard.controller;

import com.condocompare.dashboard.dto.DashboardChartsDTO;
import com.condocompare.dashboard.dto.DashboardMetricsDTO;
import com.condocompare.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Metricas do dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/metrics")
    @Operation(summary = "Obter metricas do dashboard")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DashboardMetricsDTO> getMetrics() {
        return ResponseEntity.ok(dashboardService.getMetrics());
    }

    @GetMapping("/charts")
    @Operation(summary = "Obter dados para graficos do dashboard")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DashboardChartsDTO> getChartData() {
        return ResponseEntity.ok(dashboardService.getChartData());
    }
}
