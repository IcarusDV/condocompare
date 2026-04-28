import axios from 'axios'
import { api } from '@/lib/api'
import {
  VistoriaResponse,
  VistoriaListResponse,
  CreateVistoriaRequest,
  UpdateVistoriaRequest,
  VistoriaItem,
  VistoriaFoto,
  TipoVistoria,
  StatusVistoria,
  ExternalVistoriaResponse,
  SharedLinkResponse,
  Page,
} from '@/types'

const BASE_URL = '/vistorias'

export interface VistoriaFilter {
  condominioId?: string
  tipo?: TipoVistoria
  status?: StatusVistoria
  dataInicio?: string
  dataFim?: string
}

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
}

export const vistoriaService = {
  async create(data: CreateVistoriaRequest): Promise<VistoriaResponse> {
    const response = await api.post<VistoriaResponse>(BASE_URL, data)
    return response.data
  },

  async update(id: string, data: UpdateVistoriaRequest): Promise<VistoriaResponse> {
    const response = await api.put<VistoriaResponse>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  async getById(id: string): Promise<VistoriaResponse> {
    const response = await api.get<VistoriaResponse>(`${BASE_URL}/${id}`)
    return response.data
  },

  async list(
    filter?: VistoriaFilter,
    pagination?: PaginationParams
  ): Promise<Page<VistoriaListResponse>> {
    const params = new URLSearchParams()

    if (pagination?.page !== undefined) params.append('page', String(pagination.page))
    if (pagination?.size !== undefined) params.append('size', String(pagination.size))
    if (pagination?.sort) params.append('sort', pagination.sort)

    if (filter?.condominioId) params.append('condominioId', filter.condominioId)
    if (filter?.tipo) params.append('tipo', filter.tipo)
    if (filter?.status) params.append('status', filter.status)
    if (filter?.dataInicio) params.append('dataInicio', filter.dataInicio)
    if (filter?.dataFim) params.append('dataFim', filter.dataFim)

    const response = await api.get<Page<VistoriaListResponse>>(
      `${BASE_URL}?${params.toString()}`
    )
    return response.data
  },

  async listByCondominio(condominioId: string): Promise<VistoriaListResponse[]> {
    const response = await api.get<VistoriaListResponse[]>(
      `${BASE_URL}/condominio/${condominioId}`
    )
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`)
  },

  async getTipos(): Promise<TipoVistoria[]> {
    const response = await api.get<TipoVistoria[]>(`${BASE_URL}/tipos`)
    return response.data
  },

  async getStatus(): Promise<StatusVistoria[]> {
    const response = await api.get<StatusVistoria[]>(`${BASE_URL}/status`)
    return response.data
  },

  // Checklist Items
  async getItens(vistoriaId: string): Promise<VistoriaItem[]> {
    const response = await api.get<VistoriaItem[]>(`${BASE_URL}/${vistoriaId}/itens`)
    return response.data
  },

  async addItem(vistoriaId: string, item: Partial<VistoriaItem>): Promise<VistoriaItem> {
    const response = await api.post<VistoriaItem>(`${BASE_URL}/${vistoriaId}/itens`, item)
    return response.data
  },

  async updateItem(vistoriaId: string, itemId: string, item: Partial<VistoriaItem>): Promise<VistoriaItem> {
    const response = await api.put<VistoriaItem>(`${BASE_URL}/${vistoriaId}/itens/${itemId}`, item)
    return response.data
  },

  async deleteItem(vistoriaId: string, itemId: string): Promise<void> {
    await api.delete(`${BASE_URL}/${vistoriaId}/itens/${itemId}`)
  },

  async loadDefaultChecklist(vistoriaId: string): Promise<VistoriaItem[]> {
    const response = await api.post<VistoriaItem[]>(`${BASE_URL}/${vistoriaId}/itens/checklist-padrao`)
    return response.data
  },

  // Photos
  async getFotos(vistoriaId: string): Promise<VistoriaFoto[]> {
    const response = await api.get<VistoriaFoto[]>(`${BASE_URL}/${vistoriaId}/fotos`)
    return response.data
  },

  async addFoto(vistoriaId: string, foto: Partial<VistoriaFoto>): Promise<VistoriaFoto> {
    const response = await api.post<VistoriaFoto>(`${BASE_URL}/${vistoriaId}/fotos`, foto)
    return response.data
  },

  async deleteFoto(vistoriaId: string, fotoId: string): Promise<void> {
    await api.delete(`${BASE_URL}/${vistoriaId}/fotos/${fotoId}`)
  },

  // Laudo
  async gerarLaudo(vistoriaId: string): Promise<VistoriaResponse> {
    const response = await api.post<VistoriaResponse>(`${BASE_URL}/${vistoriaId}/gerar-laudo`)
    return response.data
  },

  // External Link Sharing
  async generateLink(id: string): Promise<SharedLinkResponse> {
    const response = await api.post<SharedLinkResponse>(`${BASE_URL}/${id}/generate-link`)
    return response.data
  },

  async revokeLink(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}/revoke-link`)
  },
}

export async function fetchExternalVistoria(token: string): Promise<ExternalVistoriaResponse> {
  const response = await axios.get<ExternalVistoriaResponse>(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/v1/vistorias/external/${token}`
  )
  return response.data
}

export const getTipoVistoriaLabel = (tipo: TipoVistoria): string => {
  const labels: Record<TipoVistoria, string> = {
    INICIAL: 'Inicial',
    PERIODICA: 'Periódica',
    CONSTATACAO: 'Constatação',
  }
  return labels[tipo] || tipo
}

export const getStatusVistoriaLabel = (status: StatusVistoria): string => {
  const labels: Record<StatusVistoria, string> = {
    AGENDADA: 'Agendada',
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDA: 'Concluida',
    CANCELADA: 'Cancelada',
  }
  return labels[status] || status
}

export const getStatusVistoriaColor = (status: StatusVistoria): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
  const colors: Record<StatusVistoria, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
    AGENDADA: 'primary',
    EM_ANDAMENTO: 'warning',
    CONCLUIDA: 'success',
    CANCELADA: 'error',
  }
  return colors[status] || 'default'
}
