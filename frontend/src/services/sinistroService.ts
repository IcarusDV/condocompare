import { api } from '@/lib/api'
import {
  SinistroResponse,
  SinistroListResponse,
  CreateSinistroRequest,
  UpdateSinistroRequest,
  TipoSinistro,
  StatusSinistro,
  Page,
} from '@/types'

const BASE_URL = '/sinistros'

export interface SinistroFilter {
  condominioId?: string
  tipo?: TipoSinistro
  status?: StatusSinistro
  dataInicio?: string
  dataFim?: string
}

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
}

export const sinistroService = {
  async create(data: CreateSinistroRequest): Promise<SinistroResponse> {
    const response = await api.post<SinistroResponse>(BASE_URL, data)
    return response.data
  },

  async update(id: string, data: UpdateSinistroRequest): Promise<SinistroResponse> {
    const response = await api.put<SinistroResponse>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  async addHistorico(id: string, descricao: string): Promise<SinistroResponse> {
    const response = await api.post<SinistroResponse>(`${BASE_URL}/${id}/historico`, { descricao })
    return response.data
  },

  async getById(id: string): Promise<SinistroResponse> {
    const response = await api.get<SinistroResponse>(`${BASE_URL}/${id}`)
    return response.data
  },

  async list(
    filter?: SinistroFilter,
    pagination?: PaginationParams
  ): Promise<Page<SinistroListResponse>> {
    const params = new URLSearchParams()

    if (pagination?.page !== undefined) params.append('page', String(pagination.page))
    if (pagination?.size !== undefined) params.append('size', String(pagination.size))
    if (pagination?.sort) params.append('sort', pagination.sort)

    if (filter?.condominioId) params.append('condominioId', filter.condominioId)
    if (filter?.tipo) params.append('tipo', filter.tipo)
    if (filter?.status) params.append('status', filter.status)
    if (filter?.dataInicio) params.append('dataInicio', filter.dataInicio)
    if (filter?.dataFim) params.append('dataFim', filter.dataFim)

    const response = await api.get<Page<SinistroListResponse>>(
      `${BASE_URL}?${params.toString()}`
    )
    return response.data
  },

  async listByCondominio(condominioId: string): Promise<SinistroListResponse[]> {
    const response = await api.get<SinistroListResponse[]>(
      `${BASE_URL}/condominio/${condominioId}`
    )
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`)
  },

  async getTipos(): Promise<TipoSinistro[]> {
    const response = await api.get<TipoSinistro[]>(`${BASE_URL}/tipos`)
    return response.data
  },

  async getStatus(): Promise<StatusSinistro[]> {
    const response = await api.get<StatusSinistro[]>(`${BASE_URL}/status`)
    return response.data
  },
}

export const getTipoSinistroLabel = (tipo: TipoSinistro): string => {
  const labels: Record<TipoSinistro, string> = {
    INCENDIO: 'Incendio',
    ROUBO: 'Roubo',
    DANOS_AGUA: 'Danos por Agua',
    DANOS_ELETRICOS: 'Danos Eletricos',
    RESPONSABILIDADE_CIVIL: 'Responsabilidade Civil',
    VENDAVAL: 'Vendaval',
    OUTROS: 'Outros',
  }
  return labels[tipo] || tipo
}

export const getStatusSinistroLabel = (status: StatusSinistro): string => {
  const labels: Record<StatusSinistro, string> = {
    ABERTO: 'Aberto',
    EM_ANALISE: 'Em Analise',
    APROVADO: 'Aprovado',
    NEGADO: 'Negado',
    PAGO: 'Pago',
    CANCELADO: 'Cancelado',
  }
  return labels[status] || status
}

export const getStatusSinistroColor = (status: StatusSinistro): 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' => {
  const colors: Record<StatusSinistro, 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info'> = {
    ABERTO: 'warning',
    EM_ANALISE: 'info',
    APROVADO: 'primary',
    NEGADO: 'error',
    PAGO: 'success',
    CANCELADO: 'default',
  }
  return colors[status] || 'default'
}
