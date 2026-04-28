import { api } from '@/lib/api'
import {
  SeguradoraResponse,
  SeguradoraStatsResponse,
  CreateSeguradoraRequest,
  ApoliceListResponse,
} from '@/types'

const BASE_URL = '/seguradoras'

export const seguradoraService = {
  async list(): Promise<SeguradoraResponse[]> {
    const response = await api.get<SeguradoraResponse[]>(BASE_URL)
    return response.data
  },

  async getById(id: string): Promise<SeguradoraResponse> {
    const response = await api.get<SeguradoraResponse>(`${BASE_URL}/${id}`)
    return response.data
  },

  async search(nome: string): Promise<SeguradoraResponse[]> {
    const response = await api.get<SeguradoraResponse[]>(`${BASE_URL}/search`, {
      params: { nome },
    })
    return response.data
  },

  async create(data: CreateSeguradoraRequest): Promise<SeguradoraResponse> {
    const response = await api.post<SeguradoraResponse>(BASE_URL, data)
    return response.data
  },

  async update(id: string, data: CreateSeguradoraRequest): Promise<SeguradoraResponse> {
    const response = await api.put<SeguradoraResponse>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`)
  },

  async getStats(id: string): Promise<SeguradoraStatsResponse> {
    const response = await api.get<SeguradoraStatsResponse>(`${BASE_URL}/${id}/stats`)
    return response.data
  },

  async getApolices(seguradoraId: string): Promise<ApoliceListResponse[]> {
    const response = await api.get<ApoliceListResponse[]>(`/apolices`, {
      params: { seguradoraId },
    })
    return response.data
  },

  async uploadCondicoesGerais(id: string, file: File): Promise<SeguradoraResponse> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<SeguradoraResponse>(
      `${BASE_URL}/${id}/condicoes-gerais`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  async removerCondicoesGerais(id: string): Promise<SeguradoraResponse> {
    const response = await api.delete<SeguradoraResponse>(`${BASE_URL}/${id}/condicoes-gerais`)
    return response.data
  },
}
