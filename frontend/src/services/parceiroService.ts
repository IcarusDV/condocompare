import { api } from '@/lib/api'
import {
  ParceiroResponse,
  ParceiroListResponse,
  CreateParceiroRequest,
  UpdateParceiroRequest,
  ParceiroFilter,
  CategoriaParceiro,
  CategoriaParceiroResponse,
  Page,
} from '@/types'

const BASE_URL = '/parceiros'

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
}

export const parceiroService = {
  async create(data: CreateParceiroRequest): Promise<ParceiroResponse> {
    const response = await api.post<ParceiroResponse>(BASE_URL, data)
    return response.data
  },

  async getById(id: string): Promise<ParceiroResponse> {
    const response = await api.get<ParceiroResponse>(`${BASE_URL}/${id}`)
    return response.data
  },

  async update(id: string, data: UpdateParceiroRequest): Promise<ParceiroResponse> {
    const response = await api.put<ParceiroResponse>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`)
  },

  async list(
    filter?: ParceiroFilter,
    pagination?: PaginationParams
  ): Promise<Page<ParceiroListResponse>> {
    const params = new URLSearchParams()

    if (pagination?.page !== undefined) params.append('page', String(pagination.page))
    if (pagination?.size !== undefined) params.append('size', String(pagination.size))
    if (pagination?.sort) params.append('sort', pagination.sort)

    if (filter?.search) params.append('search', filter.search)
    if (filter?.categoria) params.append('categoria', filter.categoria)
    if (filter?.cidade) params.append('cidade', filter.cidade)
    if (filter?.estado) params.append('estado', filter.estado)
    if (filter?.ativo !== undefined) params.append('ativo', String(filter.ativo))
    if (filter?.verificado !== undefined) params.append('verificado', String(filter.verificado))

    const response = await api.get<Page<ParceiroListResponse>>(
      `${BASE_URL}?${params.toString()}`
    )
    return response.data
  },

  async activate(id: string): Promise<void> {
    await api.post(`${BASE_URL}/${id}/ativar`)
  },

  async deactivate(id: string): Promise<void> {
    await api.post(`${BASE_URL}/${id}/desativar`)
  },

  async verify(id: string): Promise<void> {
    await api.post(`${BASE_URL}/${id}/verificar`)
  },

  async findByCategoria(categoria: CategoriaParceiro): Promise<ParceiroListResponse[]> {
    const response = await api.get<ParceiroListResponse[]>(
      `${BASE_URL}/categoria/${categoria}`
    )
    return response.data
  },

  async findByCategoriaAndCidade(
    categoria: CategoriaParceiro,
    cidade: string
  ): Promise<ParceiroListResponse[]> {
    const response = await api.get<ParceiroListResponse[]>(
      `${BASE_URL}/categoria/${categoria}/cidade/${encodeURIComponent(cidade)}`
    )
    return response.data
  },

  async findByCategoriaAndEstado(
    categoria: CategoriaParceiro,
    estado: string
  ): Promise<ParceiroListResponse[]> {
    const response = await api.get<ParceiroListResponse[]>(
      `${BASE_URL}/categoria/${categoria}/estado/${estado}`
    )
    return response.data
  },

  async findTopRated(limit: number = 10): Promise<ParceiroListResponse[]> {
    const response = await api.get<ParceiroListResponse[]>(
      `${BASE_URL}/top-rated?limit=${limit}`
    )
    return response.data
  },

  async findTopRatedByCategoria(
    categoria: CategoriaParceiro,
    limit: number = 10
  ): Promise<ParceiroListResponse[]> {
    const response = await api.get<ParceiroListResponse[]>(
      `${BASE_URL}/top-rated/categoria/${categoria}?limit=${limit}`
    )
    return response.data
  },

  async countByCategoria(): Promise<Record<CategoriaParceiro, number>> {
    const response = await api.get<Record<CategoriaParceiro, number>>(
      `${BASE_URL}/stats/categorias`
    )
    return response.data
  },

  async getCategorias(): Promise<CategoriaParceiroResponse[]> {
    const response = await api.get<CategoriaParceiroResponse[]>(
      `${BASE_URL}/categorias`
    )
    return response.data
  },

  async gerarOfertaIA(parceiroId: string, condominioId: string): Promise<string> {
    const response = await api.post<{ texto: string }>(
      `${BASE_URL}/${parceiroId}/oferta-ia`,
      { condominioId }
    )
    return response.data.texto
  },
}

export default parceiroService
