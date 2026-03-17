import { api } from '@/lib/api'
import { NotificacaoResponse, Page } from '@/types'

const BASE_URL = '/notificacoes'

export interface PaginationParams {
  page?: number
  size?: number
}

export const notificacaoService = {
  async list(pagination?: PaginationParams): Promise<Page<NotificacaoResponse>> {
    const params = new URLSearchParams()

    if (pagination?.page !== undefined) params.append('page', String(pagination.page))
    if (pagination?.size !== undefined) params.append('size', String(pagination.size))

    const response = await api.get<Page<NotificacaoResponse>>(
      `${BASE_URL}?${params.toString()}`
    )
    return response.data
  },

  async getNaoLidas(): Promise<NotificacaoResponse[]> {
    const response = await api.get<NotificacaoResponse[]>(`${BASE_URL}/nao-lidas`)
    return response.data
  },

  async countNaoLidas(): Promise<number> {
    const response = await api.get<{ count: number }>(`${BASE_URL}/count`)
    return response.data.count
  },

  async marcarComoLida(id: string): Promise<NotificacaoResponse> {
    const response = await api.put<NotificacaoResponse>(`${BASE_URL}/${id}/lida`)
    return response.data
  },

  async marcarTodasComoLidas(): Promise<void> {
    await api.put(`${BASE_URL}/marcar-todas-lidas`)
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`)
  },

  async verificarVencimentos(): Promise<void> {
    await api.post(`${BASE_URL}/verificar-vencimentos`)
  },
}

// Helper functions
export const getTipoNotificacaoLabel = (tipo: string): string => {
  const labels: Record<string, string> = {
    VENCIMENTO_APOLICE: 'Vencimento de Apolice',
    VISTORIA_AGENDADA: 'Vistoria Agendada',
    SINISTRO_ATUALIZADO: 'Sinistro Atualizado',
    DOCUMENTO_PROCESSADO: 'Documento Processado',
  }
  return labels[tipo] || tipo
}

export const getTipoNotificacaoColor = (tipo: string): 'error' | 'warning' | 'info' | 'success' => {
  const colors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
    VENCIMENTO_APOLICE: 'warning',
    VISTORIA_AGENDADA: 'info',
    SINISTRO_ATUALIZADO: 'error',
    DOCUMENTO_PROCESSADO: 'success',
  }
  return colors[tipo] || 'info'
}

export default notificacaoService
