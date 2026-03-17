import { api } from '@/lib/api'
import { PlanoResponse, AssinaturaResponse, CreateAssinaturaRequest } from '@/types'

const BASE_URL = '/billing'

export const billingService = {
  async listPlanos(): Promise<PlanoResponse[]> {
    const response = await api.get<PlanoResponse[]>(`${BASE_URL}/planos`)
    return response.data
  },

  async getPlano(id: string): Promise<PlanoResponse> {
    const response = await api.get<PlanoResponse>(`${BASE_URL}/planos/${id}`)
    return response.data
  },

  async createAssinatura(data: CreateAssinaturaRequest): Promise<AssinaturaResponse> {
    const userId = localStorage.getItem('userId') || ''
    const response = await api.post<AssinaturaResponse>(`${BASE_URL}/assinaturas`, data, {
      headers: { 'X-User-Id': userId },
    })
    return response.data
  },

  async getAssinaturaAtiva(): Promise<AssinaturaResponse | null> {
    const userId = localStorage.getItem('userId') || ''
    try {
      const response = await api.get<AssinaturaResponse>(`${BASE_URL}/assinaturas/ativa`, {
        headers: { 'X-User-Id': userId },
      })
      return response.data || null
    } catch {
      return null
    }
  },

  async getHistorico(): Promise<AssinaturaResponse[]> {
    const userId = localStorage.getItem('userId') || ''
    const response = await api.get<AssinaturaResponse[]>(`${BASE_URL}/assinaturas/historico`, {
      headers: { 'X-User-Id': userId },
    })
    return response.data
  },

  async cancelarAssinatura(): Promise<AssinaturaResponse> {
    const userId = localStorage.getItem('userId') || ''
    const response = await api.post<AssinaturaResponse>(`${BASE_URL}/assinaturas/cancelar`, null, {
      headers: { 'X-User-Id': userId },
    })
    return response.data
  },
}

export const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
