import { api } from '@/lib/api'
import { DashboardMetricsDTO, DashboardChartsData } from '@/types'

const BASE_URL = '/dashboard'

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetricsDTO> {
    const response = await api.get<DashboardMetricsDTO>(`${BASE_URL}/metrics`)
    return response.data
  },

  async getChartData(): Promise<DashboardChartsData> {
    const response = await api.get<DashboardChartsData>(`${BASE_URL}/charts`)
    return response.data
  },
}
