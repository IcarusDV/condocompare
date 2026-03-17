import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboardService'
import { DashboardMetricsDTO, DashboardChartsData } from '@/types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  charts: () => [...dashboardKeys.all, 'charts'] as const,
}

export function useDashboardMetrics() {
  return useQuery<DashboardMetricsDTO>({
    queryKey: dashboardKeys.metrics(),
    queryFn: () => dashboardService.getMetrics(),
  })
}

export function useDashboardCharts() {
  return useQuery<DashboardChartsData>({
    queryKey: dashboardKeys.charts(),
    queryFn: () => dashboardService.getChartData(),
    staleTime: 5 * 60 * 1000, // 5 minutes (chart data changes less frequently)
  })
}
