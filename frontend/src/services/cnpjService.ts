import { api } from '@/lib/api'

export interface CnpjResponse {
  cnpj: string
  razaoSocial?: string
  nomeFantasia?: string
  dataAbertura?: string
  idadeAnos?: number
  situacaoCadastral?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  cep?: string
  email?: string
  telefone?: string
  cnaePrincipal?: string
}

export const cnpjService = {
  async buscar(cnpj: string): Promise<CnpjResponse> {
    const clean = cnpj.replace(/\D/g, '')
    const { data } = await api.get<CnpjResponse>(`/cnpj/${clean}`)
    return data
  },
}
