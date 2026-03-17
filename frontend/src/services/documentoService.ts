import { api } from '@/lib/api'
import {
  DocumentoResponse,
  DocumentoListResponse,
  DocumentoFilter,
  TipoDocumento,
  Page,
  UpdateOrcamentoDataRequest,
  UpdateDocumentoMetadataRequest,
  ComparacaoResultadoDTO,
} from '@/types'

const BASE_URL = '/documentos'

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
}

export interface UploadDocumentoParams {
  file: File
  condominioId: string
  tipo: TipoDocumento
  nome: string
  observacoes?: string
  seguradoraNome?: string
}

export const documentoService = {
  async upload(params: UploadDocumentoParams): Promise<DocumentoResponse> {
    const formData = new FormData()
    formData.append('file', params.file)
    formData.append('condominioId', params.condominioId)
    formData.append('tipo', params.tipo)
    formData.append('nome', params.nome)
    if (params.observacoes) {
      formData.append('observacoes', params.observacoes)
    }
    if (params.seguradoraNome) {
      formData.append('seguradoraNome', params.seguradoraNome)
    }

    const response = await api.post<DocumentoResponse>(BASE_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getById(id: string): Promise<DocumentoResponse> {
    const response = await api.get<DocumentoResponse>(`${BASE_URL}/${id}`)
    return response.data
  },

  async list(
    filter?: DocumentoFilter,
    pagination?: PaginationParams
  ): Promise<Page<DocumentoListResponse>> {
    const params = new URLSearchParams()

    if (pagination?.page !== undefined) params.append('page', String(pagination.page))
    if (pagination?.size !== undefined) params.append('size', String(pagination.size))
    if (pagination?.sort) params.append('sort', pagination.sort)

    if (filter?.condominioId) params.append('condominioId', filter.condominioId)
    if (filter?.tipo) params.append('tipo', filter.tipo)
    if (filter?.status) params.append('status', filter.status)
    if (filter?.seguradora) params.append('seguradora', filter.seguradora)
    if (filter?.search) params.append('search', filter.search)

    const response = await api.get<Page<DocumentoListResponse>>(
      `${BASE_URL}?${params.toString()}`
    )
    return response.data
  },

  async listByCondominio(condominioId: string): Promise<DocumentoListResponse[]> {
    const response = await api.get<DocumentoListResponse[]>(
      `${BASE_URL}/condominio/${condominioId}`
    )
    return response.data
  },

  async listByCondominioAndTipo(
    condominioId: string,
    tipo: TipoDocumento
  ): Promise<DocumentoListResponse[]> {
    const response = await api.get<DocumentoListResponse[]>(
      `${BASE_URL}/condominio/${condominioId}/tipo/${tipo}`
    )
    return response.data
  },

  async listOrcamentosParaComparacao(condominioId: string): Promise<DocumentoListResponse[]> {
    const response = await api.get<DocumentoListResponse[]>(
      `${BASE_URL}/condominio/${condominioId}/orcamentos`
    )
    return response.data
  },

  async getDownloadUrl(id: string): Promise<string> {
    const response = await api.get<{ url: string }>(`${BASE_URL}/${id}/download-url`)
    return response.data.url
  },

  async download(id: string): Promise<Blob> {
    const response = await api.get(`${BASE_URL}/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  async updateDocumento(id: string, data: UpdateDocumentoMetadataRequest): Promise<DocumentoResponse> {
    const response = await api.put<DocumentoResponse>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`)
  },

  async deleteMultiple(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => api.delete(`${BASE_URL}/${id}`)))
  },

  async getTipos(): Promise<TipoDocumento[]> {
    const response = await api.get<TipoDocumento[]>(`${BASE_URL}/tipos`)
    return response.data
  },

  // === Metodos de Comparacao de Orcamentos ===

  async updateOrcamentoData(
    id: string,
    data: UpdateOrcamentoDataRequest
  ): Promise<DocumentoResponse> {
    const response = await api.put<DocumentoResponse>(
      `${BASE_URL}/${id}/orcamento-data`,
      data
    )
    return response.data
  },

  async reprocess(id: string): Promise<DocumentoResponse> {
    const response = await api.post<DocumentoResponse>(`${BASE_URL}/${id}/reprocess`)
    return response.data
  },

  async compararOrcamentos(
    condominioId: string,
    orcamentoIds: string[]
  ): Promise<ComparacaoResultadoDTO> {
    const response = await api.post<ComparacaoResultadoDTO>(
      `${BASE_URL}/condominio/${condominioId}/comparar`,
      orcamentoIds
    )
    return response.data
  },
}

// Helper functions
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const getTipoDocumentoLabel = (tipo: TipoDocumento): string => {
  const labels: Record<TipoDocumento, string> = {
    APOLICE: 'Apolice',
    ORCAMENTO: 'Orcamento',
    CONDICOES_GERAIS: 'Condicoes Gerais',
    LAUDO_VISTORIA: 'Laudo de Vistoria',
    SINISTRO: 'Sinistro',
    OUTRO: 'Outro',
  }
  return labels[tipo] || tipo
}

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PENDENTE: 'Pendente',
    PROCESSANDO: 'Processando',
    CONCLUIDO: 'Concluido',
    ERRO: 'Erro',
  }
  return labels[status] || status
}

export const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
  const colors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
    PENDENTE: 'default',
    PROCESSANDO: 'primary',
    CONCLUIDO: 'success',
    ERRO: 'error',
  }
  return colors[status] || 'default'
}
