import { api } from '@/lib/api'
import {
  CondominioListResponse,
  CondominioResponse,
  CreateCondominioRequest,
  UpdateCondominioRequest,
  CondominioFilter,
  Page,
} from '@/types'

const BASE_URL = '/condominios'

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
}

export const condominioService = {
  async list(
    filter?: CondominioFilter,
    pagination?: PaginationParams
  ): Promise<Page<CondominioListResponse>> {
    const params = new URLSearchParams()

    if (pagination?.page !== undefined) params.append('page', String(pagination.page))
    if (pagination?.size !== undefined) params.append('size', String(pagination.size))
    if (pagination?.sort) params.append('sort', pagination.sort)

    if (filter?.search) params.append('search', filter.search)
    if (filter?.cidade) params.append('cidade', filter.cidade)
    if (filter?.estado) params.append('estado', filter.estado)
    if (filter?.tipoConstrucao) params.append('tipoConstrucao', filter.tipoConstrucao)
    if (filter?.seguradora) params.append('seguradora', filter.seguradora)
    if (filter?.apoliceVencendo) params.append('apoliceVencendo', 'true')
    if (filter?.apoliceVencida) params.append('apoliceVencida', 'true')

    const response = await api.get<Page<CondominioListResponse>>(
      `${BASE_URL}?${params.toString()}`
    )
    return response.data
  },

  async getById(id: string): Promise<CondominioResponse> {
    const response = await api.get<CondominioResponse>(`${BASE_URL}/${id}`)
    return response.data
  },

  async create(data: CreateCondominioRequest): Promise<CondominioResponse> {
    const response = await api.post<CondominioResponse>(BASE_URL, data)
    return response.data
  },

  async update(id: string, data: UpdateCondominioRequest): Promise<CondominioResponse> {
    const response = await api.put<CondominioResponse>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`)
  },

  async getVencendo(dias: number = 30): Promise<CondominioListResponse[]> {
    const response = await api.get<CondominioListResponse[]>(
      `${BASE_URL}/vencendo?dias=${dias}`
    )
    return response.data
  },

  async getVencidos(): Promise<CondominioListResponse[]> {
    const response = await api.get<CondominioListResponse[]>(`${BASE_URL}/vencidos`)
    return response.data
  },

  async vincularSindico(condominioId: string, sindicoId: string): Promise<CondominioResponse> {
    const response = await api.post<CondominioResponse>(
      `${BASE_URL}/${condominioId}/vincular-sindico?sindicoId=${sindicoId}`
    )
    return response.data
  },

  async vincularAdministradora(
    condominioId: string,
    administradoraId: string,
    administradoraNome: string
  ): Promise<CondominioResponse> {
    const response = await api.post<CondominioResponse>(
      `${BASE_URL}/${condominioId}/vincular-administradora`,
      null,
      {
        params: { administradoraId, administradoraNome },
      }
    )
    return response.data
  },
}
