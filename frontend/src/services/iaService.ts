import axios from 'axios'

const IA_API_URL = process.env.NEXT_PUBLIC_IA_URL || 'http://localhost:8000/api/v1'

const iaApi = axios.create({
  baseURL: IA_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  condominio_id?: string
  history: ChatMessage[]
  context_type: 'geral' | 'cobertura' | 'franquia' | 'sinistro' | 'comparacao' | 'diagnostico' | 'condominio'
}

export interface ChatResponse {
  response: string
  sources: string[]
  context_used: boolean
}

// Diagnostico Types
export interface DiagnosticoRequest {
  condominio_id: string
  apolice_id?: string
  coberturas: Array<{
    nome: string
    valorLimite?: number
    franquia?: number
    incluido?: boolean
  }>
  dados_condominio?: Record<string, unknown>
  dados_orcamentos?: Array<Record<string, unknown>>
}

export interface Recomendacao {
  tipo: 'melhoria' | 'alerta' | 'cuidado'
  categoria: string
  descricao: string
  prioridade: number
  impacto: string
}

export interface RiscoIdentificado {
  risco: string
  severidade: 'alta' | 'media' | 'baixa'
  mitigacao: string
}

export interface DiagnosticoResponse {
  condominio_id: string
  condominio_nome?: string
  score: number
  status: 'adequado' | 'atencao' | 'critico'
  coberturas_adequadas: string[]
  coberturas_insuficientes: string[]
  coberturas_ausentes: string[]
  recomendacoes: Recomendacao[]
  riscos_identificados: RiscoIdentificado[]
}

export const iaService = {
  // Chat
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await iaApi.post<ChatResponse>('/chat/', request)
    return response.data
  },

  async explainCoverage(cobertura: string, seguradora?: string): Promise<{ cobertura: string; explicacao: string }> {
    const params = new URLSearchParams({ cobertura })
    if (seguradora) params.append('seguradora', seguradora)
    const response = await iaApi.post(`/chat/explain-coverage?${params.toString()}`)
    return response.data
  },

  // Diagnostico
  async analyzeDiagnostico(request: DiagnosticoRequest): Promise<DiagnosticoResponse> {
    const response = await iaApi.post<DiagnosticoResponse>('/diagnostico/analyze', request)
    return response.data
  },

  async getScore(condominioId: string): Promise<{ condominio_id: string; score: number; status: string }> {
    const response = await iaApi.get(`/diagnostico/${condominioId}/score`)
    return response.data
  },

  // Comparison Analysis
  async analyzeComparacao(dados: {
    orcamentos: Array<{
      seguradora: string
      valorPremio: number
      coberturas: Array<{ nome: string; valorLimite?: number; franquia?: number; incluido: boolean }>
      formaPagamento?: string
      descontos?: number
    }>
  }): Promise<{ analise: string }> {
    const response = await iaApi.post('/chat/analyze-comparacao', dados)
    return response.data
  },

  // PDF Extraction
  async extractPdf(file: File, tipo: string = 'orcamento'): Promise<{
    tipo: string
    dados_extraidos: {
      seguradoraNome?: string
      valorPremio?: number
      dataVigenciaInicio?: string
      dataVigenciaFim?: string
      formaPagamento?: string
      descontos?: number
      coberturas?: Array<{
        nome: string
        valorLimite?: number
        franquia?: number
        incluido: boolean
      }>
    }
    status: string
    texto_extraido?: string
  }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('tipo', tipo)
    const response = await iaApi.post('/documents/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Extract Condominium Data from document (apolice, orcamento, etc)
  async extractCondominioData(file: File): Promise<{
    success: boolean
    dados_extraidos: {
      nome?: string
      cnpj?: string
      endereco?: string
      numero?: string
      bairro?: string
      cidade?: string
      estado?: string
      cep?: string
      areaConstruida?: number
      numeroUnidades?: number
      numeroBlocos?: number
      seguradoraAtual?: string
      vencimentoApolice?: string
    }
    status: string
    message?: string
  }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await iaApi.post('/documents/extract?tipo=condominio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Sinistro Help
  async getSinistroHelp(tipo: string, descricao?: string): Promise<{
    success: boolean
    data?: {
      documentos_necessarios: string[]
      passos_imediatos: string[]
      prazo_estimado: string
      dicas: string[]
      cuidados: string[]
    }
    message?: string
  }> {
    const response = await iaApi.post('/chat/sinistro-help', { tipo, descricao })
    return response.data
  },

  // Report generation
  async generateReport(diagnostico: {
    condominio_nome?: string
    condominio_id?: string
    score: number
    status: string
    coberturas_adequadas: string[]
    coberturas_insuficientes: string[]
    coberturas_ausentes: string[]
    recomendacoes: Array<{
      tipo: string
      categoria: string
      descricao: string
      prioridade: number
      impacto: string
    }>
    riscos_identificados: Array<{
      risco: string
      severidade: string
      mitigacao: string
    }>
    dados_condominio?: Record<string, unknown>
  }): Promise<{ success: boolean; relatorio_markdown: string }> {
    const response = await iaApi.post('/reports/diagnostico', diagnostico)
    return response.data
  },

  // Health check
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await iaApi.get('/health')
    return response.data
  },
}

export default iaService
