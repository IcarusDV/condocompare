import { api } from '@/lib/api'
import {
  ApoliceResponse,
  ApoliceListResponse,
  ApoliceFilter,
  CreateApoliceRequest,
  CoberturaResponse,
  StatusApoliceType,
  Page,
} from '@/types'

const BASE_URL = '/apolices'

export interface ApolicePaginationParams {
  page?: number
  size?: number
  sort?: string
}

export const apoliceService = {
  async list(
    filter?: ApoliceFilter,
    pagination?: ApolicePaginationParams
  ): Promise<Page<ApoliceListResponse>> {
    const params = new URLSearchParams()

    if (pagination?.page !== undefined) params.append('page', String(pagination.page))
    if (pagination?.size !== undefined) params.append('size', String(pagination.size))
    if (pagination?.sort) params.append('sort', pagination.sort)

    if (filter?.search) params.append('search', filter.search)
    if (filter?.condominioId) params.append('condominioId', filter.condominioId)
    if (filter?.seguradoraId) params.append('seguradoraId', filter.seguradoraId)
    if (filter?.status) params.append('status', filter.status)
    if (filter?.vigente !== undefined) params.append('vigente', String(filter.vigente))
    if (filter?.vencendo !== undefined) params.append('vencendo', String(filter.vencendo))

    const response = await api.get<Page<ApoliceListResponse>>(
      `${BASE_URL}?${params.toString()}`
    )
    return response.data
  },

  async getById(id: string): Promise<ApoliceResponse> {
    const response = await api.get<ApoliceResponse>(`${BASE_URL}/${id}`)
    return response.data
  },

  async create(data: CreateApoliceRequest): Promise<ApoliceResponse> {
    const response = await api.post<ApoliceResponse>(BASE_URL, data)
    return response.data
  },

  async update(id: string, data: Partial<CreateApoliceRequest>): Promise<ApoliceResponse> {
    const response = await api.put<ApoliceResponse>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`)
  },

  async getByCondominio(condominioId: string): Promise<ApoliceListResponse[]> {
    const response = await api.get<ApoliceListResponse[]>(
      `${BASE_URL}/condominio/${condominioId}`
    )
    return response.data
  },

  async getVigenteByCondominio(condominioId: string): Promise<ApoliceResponse> {
    const response = await api.get<ApoliceResponse>(
      `${BASE_URL}/condominio/${condominioId}/vigente`
    )
    return response.data
  },

  async getVencendo(): Promise<ApoliceListResponse[]> {
    const response = await api.get<ApoliceListResponse[]>(`${BASE_URL}/vencendo`)
    return response.data
  },

  async getVencidas(): Promise<ApoliceListResponse[]> {
    const response = await api.get<ApoliceListResponse[]>(`${BASE_URL}/vencidas`)
    return response.data
  },

  async getCoberturas(apoliceId: string): Promise<CoberturaResponse[]> {
    const response = await api.get<CoberturaResponse[]>(
      `${BASE_URL}/${apoliceId}/coberturas`
    )
    return response.data
  },

  async renovar(id: string): Promise<ApoliceResponse> {
    const response = await api.post<ApoliceResponse>(`${BASE_URL}/${id}/renovar`)
    return response.data
  },
}

export const getStatusApoliceLabel = (status: StatusApoliceType): string => {
  const labels: Record<StatusApoliceType, string> = {
    VIGENTE: 'Vigente',
    VENCIDA: 'Vencida',
    CANCELADA: 'Cancelada',
    PENDENTE: 'Pendente',
    EM_RENOVACAO: 'Em Renovacao',
  }
  return labels[status] || status
}

export const getStatusApoliceColor = (
  status: StatusApoliceType
): 'success' | 'error' | 'default' | 'warning' | 'primary' => {
  const colors: Record<StatusApoliceType, 'success' | 'error' | 'default' | 'warning' | 'primary'> = {
    VIGENTE: 'success',
    VENCIDA: 'error',
    CANCELADA: 'default',
    PENDENTE: 'warning',
    EM_RENOVACAO: 'primary',
  }
  return colors[status] || 'default'
}
