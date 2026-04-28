export type Role = 'ADMIN' | 'CORRETORA' | 'ADMINISTRADORA' | 'SINDICO'
export type TipoConstrucao =
  | 'RESIDENCIAL'
  | 'RESIDENCIAL_HORIZONTAL'
  | 'RESIDENCIAL_COM_ESCRITORIOS'
  | 'COMERCIAL_VERTICAL'
  | 'COMERCIAL_HORIZONTAL'
  | 'ESCRITORIOS_CONSULTORIOS'
  | 'ESCRITORIOS_COM_COMERCIO'
  | 'LOGISTICO_INDUSTRIAL'
  | 'CENTRO_COMERCIAL'
  | 'GALERIA_COMERCIAL'
  | 'SHOPPING_CENTER'
  | 'EDIFICIO_GARAGEM'
  | 'MISTO'
  | 'FLAT_APART_HOTEL'
  | 'FLAT_COM_COMERCIO'
  | 'HOTEL'
  | 'EM_CONSTRUCAO'
  | 'DESOCUPADO'
  | 'OUTROS'
export type StatusApolice = 'VENCIDA' | 'VENCENDO' | 'VIGENTE' | 'SEM_APOLICE'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: Role
  organizationId?: string
  organizationName?: string
}

// Response DTOs - matching backend
export interface CondominioListResponse {
  id: string
  nome: string
  cnpj?: string
  cidade?: string
  estado?: string
  numeroUnidades?: number
  tipoConstrucao?: TipoConstrucao
  seguradoraAtual?: string
  vencimentoApolice?: string
  diasParaVencimento?: number
  statusApolice: StatusApolice
}

export interface CondominioResponse {
  id: string
  nome: string
  cnpj?: string
  observacoes?: string
  endereco: EnderecoResponse
  caracteristicas: CaracteristicasResponse
  amenidades: AmenidadesResponse
  sindico: SindicoResponse
  seguro: SeguroResponse
  createdAt: string
  updatedAt: string
}

export interface EnderecoResponse {
  endereco: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
}

export interface CaracteristicasResponse {
  areaConstruida?: number
  areaTotal?: number
  numeroUnidades?: number
  numeroBlocos?: number
  numeroElevadores?: number
  numeroAndares?: number
  numeroFuncionarios?: number
  anoConstrucao?: number
  tipoConstrucao?: TipoConstrucao
  numeroCasas?: number
  numeroSalas?: number
}

export interface AmenidadesResponse {
  temPlacasSolares?: boolean
  temPiscina?: boolean
  temAcademia?: boolean
  temSalaoFestas?: boolean
  temPlayground?: boolean
  temChurrasqueira?: boolean
  temQuadra?: boolean
  temPortaria24h?: boolean
  possuiAreaComercial?: boolean
  tamanhoAreaComercial?: number
  numFuncionariosRegistrados?: number
  idadeFuncionariosRegistrados?: string
  numPavimentos?: number
  possuiGaragem?: boolean
  vagasGaragem?: number
  espacosConveniencia?: string[]
  espacosConvenienciaOutros?: string
  sistemaProtecaoIncendio?: string[]
  sistemaProtecaoIncendioOutros?: string
  possuiRecargaEletricos?: boolean
  possuiBicicletario?: boolean
}

export interface SindicoResponse {
  sindicoId?: string
  sindicoNome?: string
  sindicoEmail?: string
  sindicoTelefone?: string
}

export interface SeguroResponse {
  vencimentoApolice?: string
  seguradoraAtual?: string
  diasParaVencimento?: number
  bonusAnosSemSinistro?: string
  quantidadeSinistros?: string
}

// Request DTOs
export interface CreateCondominioRequest {
  nome: string
  cnpj?: string
  endereco: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  areaConstruida?: number
  areaTotal?: number
  numeroUnidades?: number
  numeroBlocos?: number
  numeroElevadores?: number
  numeroAndares?: number
  numeroFuncionarios?: number
  anoConstrucao?: number
  temPlacasSolares?: boolean
  temPiscina?: boolean
  temAcademia?: boolean
  temSalaoFestas?: boolean
  temPlayground?: boolean
  temChurrasqueira?: boolean
  temQuadra?: boolean
  temPortaria24h?: boolean
  possuiAreaComercial?: boolean
  tamanhoAreaComercial?: number
  numFuncionariosRegistrados?: number
  idadeFuncionariosRegistrados?: string
  numPavimentos?: number
  possuiGaragem?: boolean
  vagasGaragem?: number
  espacosConveniencia?: string[]
  espacosConvenienciaOutros?: string
  sistemaProtecaoIncendio?: string[]
  sistemaProtecaoIncendioOutros?: string
  possuiRecargaEletricos?: boolean
  possuiBicicletario?: boolean
  tipoConstrucao?: TipoConstrucao
  sindicoNome?: string
  sindicoEmail?: string
  sindicoTelefone?: string
  vencimentoApolice?: string
  bonusAnosSemSinistro?: string
  quantidadeSinistros?: string
  numeroCasas?: number
  numeroSalas?: number
  seguradoraAtual?: string
  observacoes?: string
}

export interface UpdateCondominioRequest extends Partial<CreateCondominioRequest> {}

export interface CondominioFilter {
  search?: string
  cidade?: string
  estado?: string
  tipoConstrucao?: TipoConstrucao
  seguradora?: string
  apoliceVencendo?: boolean
  apoliceVencida?: boolean
}

// Pagination
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// Legacy Condominio interface for backwards compatibility
export interface Condominio {
  id: string
  nome: string
  cnpj?: string
  endereco: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  areaConstruida?: number
  areaTotal?: number
  numeroUnidades?: number
  numeroBlocos?: number
  numeroElevadores?: number
  numeroAndares?: number
  numeroFuncionarios?: number
  anoConstrucao?: number
  temPlacasSolares?: boolean
  temPiscina?: boolean
  temAcademia?: boolean
  temSalaoFestas?: boolean
  temPlayground?: boolean
  temChurrasqueira?: boolean
  temQuadra?: boolean
  temPortaria24h?: boolean
  tipoConstrucao?: TipoConstrucao
  administradoraId?: string
  administradoraNome?: string
  sindicoId?: string
  sindicoNome?: string
  sindicoEmail?: string
  sindicoTelefone?: string
  vencimentoApolice?: string
  seguradoraAtual?: string
}

// ========== DOCUMENTOS ==========
export type TipoDocumento =
  | 'APOLICE'
  | 'ORCAMENTO'
  | 'CONDICOES_GERAIS'
  | 'LAUDO_VISTORIA'
  | 'SINISTRO'
  | 'CONVENCAO'
  | 'REGIMENTO_INTERNO'
  | 'ATA_ASSEMBLEIA'
  | 'HABITE_SE'
  | 'AVCB'
  | 'ALVARA'
  | 'LAUDO_TECNICO'
  | 'PLANTA'
  | 'CONTRATO'
  | 'OUTRO'
export type StatusProcessamento = 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO'

export interface DocumentoResponse {
  id: string
  condominioId: string
  tipo: TipoDocumento
  nome: string
  nomeArquivo: string
  mimeType?: string
  tamanhoBytes?: number
  status: StatusProcessamento
  erroProcessamento?: string
  dadosExtraidos?: Record<string, unknown>
  observacoes?: string
  seguradoraNome?: string
  valorPremio?: number
  dataVigenciaInicio?: string
  dataVigenciaFim?: string
  createdAt: string
  updatedAt?: string
  createdBy?: string
}

export interface DocumentoListResponse {
  id: string
  condominioId: string
  tipo: TipoDocumento
  nome: string
  nomeArquivo: string
  mimeType?: string
  tamanhoBytes?: number
  status: StatusProcessamento
  erroProcessamento?: string
  seguradoraNome?: string
  valorPremio?: number
  dataVigenciaFim?: string
  createdAt: string
}

export interface UpdateDocumentoMetadataRequest {
  nome?: string
  tipo?: TipoDocumento
  seguradoraNome?: string
  observacoes?: string
}

export interface UploadDocumentoRequest {
  condominioId: string
  tipo: TipoDocumento
  nome: string
  observacoes?: string
  seguradoraNome?: string
}

export interface DocumentoFilter {
  condominioId?: string
  tipo?: TipoDocumento
  status?: StatusProcessamento
  seguradora?: string
  search?: string
}

// Legacy interface for backwards compatibility
export interface Documento {
  id: string
  condominioId: string
  tipo: string
  nome: string
  nomeArquivo: string
  mimeType?: string
  tamanhoBytes?: number
  status: StatusProcessamento
  dadosExtraidos?: Record<string, unknown>
  createdAt: string
}

export interface DiagnosticoResult {
  condominioId: string
  score: number
  status: 'adequado' | 'atencao' | 'critico'
  coberturasAdequadas: string[]
  coberturasInsuficientes: string[]
  coberturasAusentes: string[]
  recomendacoes: Recomendacao[]
}

export interface Recomendacao {
  tipo: 'melhoria' | 'alerta' | 'cuidado'
  categoria: string
  descricao: string
  prioridade: number
  impacto: string
}

// ========== COMPARACAO ORCAMENTOS ==========

export interface CoberturaDTO {
  nome: string
  valorLimite?: number
  franquia?: number
  incluido: boolean
}

export interface DadosOrcamentoDTO {
  coberturas: CoberturaDTO[]
  condicoesEspeciais?: string[]
  descontos?: number
  formaPagamento?: string
  observacoesInternas?: string
}

export interface UpdateOrcamentoDataRequest {
  seguradoraNome: string
  valorPremio: number
  dataVigenciaInicio: string
  dataVigenciaFim: string
  dadosOrcamento: DadosOrcamentoDTO
  observacoes?: string
}

export interface OrcamentoComparacaoDTO {
  id: string
  nome: string
  seguradoraNome: string
  valorPremio: number
  dataVigenciaInicio: string
  dataVigenciaFim: string
  vigenciaDias: number
  coberturas: CoberturaDTO[]
  condicoesEspeciais: string[]
  descontos?: number
  formaPagamento?: string
  observacoes?: string
  dadosExtraidos?: Record<string, unknown>
}

export interface RecomendacaoComparacaoDTO {
  tipo: 'MENOR_PRECO' | 'MAIOR_COBERTURA' | 'MELHOR_CUSTO_BENEFICIO'
  orcamentoId: string
  seguradora: string
  justificativa: string
}

export interface ComparacaoResumoDTO {
  menorPrecoId?: string
  menorPrecoSeguradora?: string
  menorPreco?: number
  maiorCoberturaId?: string
  maiorCoberturaSeguradora?: string
  maiorValorCobertura?: number
  coberturasComuns: string[]
  coberturasExclusivas: Record<string, string[]>
  recomendacoes: RecomendacaoComparacaoDTO[]
}

export interface ComparacaoResultadoDTO {
  orcamentos: OrcamentoComparacaoDTO[]
  resumo: ComparacaoResumoDTO
}

// Coberturas padrao para facilitar preenchimento
export const COBERTURAS_PADRAO = [
  'Incendio, Raio e Explosao',
  'Queda de Aeronaves',
  'Fumaca',
  'Vendaval, Furacao, Ciclone, Tornado e Granizo',
  'Impacto de Veiculos Terrestres',
  'Danos Eletricos',
  'Responsabilidade Civil do Condominio',
  'Responsabilidade Civil do Sindico',
  'Responsabilidade Civil Guarda de Veiculos',
  'Roubo de Bens do Condominio',
  'Quebra de Vidros',
  'Alagamento e Inundacao',
  'Desmoronamento',
  'Tumultos e Greves',
  'Equipamentos Eletronicos',
  'Despesas Fixas',
  'Perda de Aluguel',
]

// ========== VISTORIAS ==========

export type TipoVistoria = 'INICIAL' | 'PERIODICA' | 'CONSTATACAO'
export type StatusVistoria = 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'

export interface VistoriaResponse {
  id: string
  condominioId: string
  condominioNome: string
  tipo: TipoVistoria
  status: StatusVistoria
  dataAgendada: string
  dataRealizada?: string
  responsavelNome?: string
  responsavelTelefone?: string
  responsavelEmail?: string
  observacoes?: string
  laudoUrl?: string
  laudoTexto?: string
  laudoGeradoEm?: string
  documentoId?: string
  itensVistoriados?: Record<string, unknown>[]
  pendencias?: Record<string, unknown>[]
  notaGeral?: number
  totalItens?: number
  itensConformes?: number
  itensNaoConformes?: number
  createdAt: string
  updatedAt?: string
  sharedToken?: string
}

export interface ExternalVistoriaResponse {
  id: string
  condominioNome: string
  tipo: TipoVistoria
  status: StatusVistoria
  dataAgendada: string
  dataRealizada?: string
  responsavelNome?: string
  observacoes?: string
  laudoTexto?: string
  laudoGeradoEm?: string
  notaGeral?: number
  totalItens?: number
  itensConformes?: number
  itensNaoConformes?: number
  itens: VistoriaItem[]
  fotos: VistoriaFoto[]
  createdAt: string
}

export interface SharedLinkResponse {
  token: string
  url: string
}

export interface VistoriaListResponse {
  id: string
  condominioId: string
  condominioNome: string
  tipo: TipoVistoria
  status: StatusVistoria
  dataAgendada: string
  dataRealizada?: string
  responsavelNome?: string
  notaGeral?: number
  totalPendencias: number
  createdAt: string
}

export interface CreateVistoriaRequest {
  condominioId: string
  tipo: TipoVistoria
  dataAgendada: string
  responsavelNome?: string
  responsavelTelefone?: string
  responsavelEmail?: string
  observacoes?: string
}

export interface UpdateVistoriaRequest {
  tipo?: TipoVistoria
  status?: StatusVistoria
  dataAgendada?: string
  dataRealizada?: string
  responsavelNome?: string
  responsavelTelefone?: string
  responsavelEmail?: string
  observacoes?: string
  laudoUrl?: string
  documentoId?: string
  itensVistoriados?: Record<string, unknown>[]
  pendencias?: Record<string, unknown>[]
  notaGeral?: number
}

export type StatusItem = 'PENDENTE' | 'CONFORME' | 'NAO_CONFORME' | 'NA'
export type SeveridadeItem = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'

export interface VistoriaItem {
  id: string
  vistoriaId: string
  categoria: string
  descricao: string
  status: StatusItem
  severidade: SeveridadeItem
  observacao?: string
  ordem: number
  createdAt?: string
  updatedAt?: string
}

export interface VistoriaFoto {
  id: string
  vistoriaId: string
  vistoriaItemId?: string
  url: string
  descricao?: string
  createdAt?: string
}

// ========== SINISTROS ==========

export type TipoSinistro = 'INCENDIO_RAIO_EXPLOSAO' | 'DANOS_AGUA' | 'DANOS_ELETRICOS' | 'ROUBO_FURTO' | 'VENDAVAL_GRANIZO' | 'RESPONSABILIDADE_CIVIL' | 'QUEBRA_VIDROS' | 'OUTROS'
export type StatusSinistro = 'ABERTO' | 'EM_ANALISE' | 'APROVADO' | 'NEGADO' | 'PAGO' | 'CANCELADO'

export interface SinistroResponse {
  id: string
  condominioId: string
  condominioNome: string
  apoliceId?: string
  numeroSinistro?: string
  tipo: TipoSinistro
  status: StatusSinistro
  dataOcorrencia: string
  dataComunicacao?: string
  descricao: string
  localOcorrencia?: string
  valorPrejuizo?: number
  valorFranquia?: number
  valorIndenizado?: number
  coberturaAcionada?: string
  documentosIds?: string[]
  fotosUrls?: string[]
  historico?: { data: string; descricao: string; usuario: string }[]
  seguradoraProtocolo?: string
  seguradoraContato?: string
  observacoes?: string
  createdAt: string
  updatedAt?: string
}

export interface SinistroListResponse {
  id: string
  condominioId: string
  condominioNome: string
  numeroSinistro?: string
  tipo: TipoSinistro
  status: StatusSinistro
  dataOcorrencia: string
  descricao: string
  valorPrejuizo?: number
  valorIndenizado?: number
  createdAt: string
}

export interface CreateSinistroRequest {
  condominioId: string
  apoliceId?: string
  tipo: TipoSinistro
  dataOcorrencia: string
  descricao: string
  localOcorrencia?: string
  valorPrejuizo?: number
  coberturaAcionada?: string
  observacoes?: string
}

export interface UpdateSinistroRequest {
  apoliceId?: string
  numeroSinistro?: string
  tipo?: TipoSinistro
  status?: StatusSinistro
  dataOcorrencia?: string
  dataComunicacao?: string
  descricao?: string
  localOcorrencia?: string
  valorPrejuizo?: number
  valorFranquia?: number
  valorIndenizado?: number
  coberturaAcionada?: string
  documentosIds?: string[]
  fotosUrls?: string[]
  seguradoraProtocolo?: string
  seguradoraContato?: string
  observacoes?: string
}

export interface SinistroStatsResponse {
  total: number
  abertos: number
  emAnalise: number
  aprovados: number
  negados: number
  pagos: number
  cancelados: number
  totalPrejuizo: number
  totalIndenizado: number
  tempoMedioResolucaoDias: number
  taxaAprovacao: number
  taxaNegacao: number
  sinistrosPorMes: { mes: string; total: number }[]
  porStatus: Record<string, number>
}

// ========== NOTIFICACOES ==========

export type TipoNotificacao = 'VENCIMENTO_APOLICE' | 'VISTORIA_AGENDADA' | 'SINISTRO_ATUALIZADO' | 'DOCUMENTO_PROCESSADO'

export interface NotificacaoResponse {
  id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  lida: boolean
  dataLeitura?: string
  referenciaTipo?: string
  referenciaId?: string
  createdAt: string
}

// ========== DASHBOARD ==========

export interface ApoliceVencendoDTO {
  id: string
  nome: string
  condominioNome: string
  seguradoraNome?: string
  dataVencimento: string
  diasParaVencer: number
}

export interface DashboardMetricsDTO {
  totalCondominios: number
  totalDocumentos: number
  totalVistorias: number
  totalSinistros: number
  totalApolices: number
  totalOrcamentos: number
  apolicesVencendo30dias: number
  proximasApolicesVencer: ApoliceVencendoDTO[]
  vistoriasAgendadas: number
  vistoriasConcluidas: number
  sinistrosAbertos: number
  sinistrosEmAnalise: number
  valorTotalPrejuizos: number
  valorTotalIndenizado: number
  notificacoesNaoLidas: number
}

// ========== PARCEIROS ==========

export type CategoriaParceiro =
  | 'ELEVADORES'
  | 'JARDINAGEM'
  | 'PORTARIA'
  | 'LIMPEZA'
  | 'ELETRICA'
  | 'HIDRAULICA'
  | 'PINTURA'
  | 'ADVOCACIA'
  | 'CONTABILIDADE'
  | 'BOMBEIRO_CIVIL'
  | 'DEDETIZACAO'
  | 'IMPERMEABILIZACAO'
  | 'AR_CONDICIONADO'
  | 'PISCINA'
  | 'GERADOR'
  | 'INTERFONE'
  | 'CFTV'
  | 'INCENDIO'
  | 'GAS'
  | 'SERRALHERIA'
  | 'VIDRACARIA'
  | 'TELHADO'
  | 'SEGUROS'
  | 'ADMINISTRACAO'
  | 'OUTRO'

export const CATEGORIAS_PARCEIRO: Record<CategoriaParceiro, string> = {
  ELEVADORES: 'Manutencao de Elevadores',
  JARDINAGEM: 'Jardinagem e Paisagismo',
  PORTARIA: 'Portaria e Seguranca',
  LIMPEZA: 'Limpeza e Conservacao',
  ELETRICA: 'Manutencao Eletrica',
  HIDRAULICA: 'Manutencao Hidraulica',
  PINTURA: 'Pintura',
  ADVOCACIA: 'Advocacia',
  CONTABILIDADE: 'Contabilidade',
  BOMBEIRO_CIVIL: 'Bombeiro Civil',
  DEDETIZACAO: 'Dedetizacao e Controle de Pragas',
  IMPERMEABILIZACAO: 'Impermeabilizacao',
  AR_CONDICIONADO: 'Ar Condicionado e Climatizacao',
  PISCINA: 'Manutencao de Piscina',
  GERADOR: 'Geradores e No-breaks',
  INTERFONE: 'Interfone e Comunicacao',
  CFTV: 'CFTV e Monitoramento',
  INCENDIO: 'Sistema de Incendio',
  GAS: 'Instalacao de Gas',
  SERRALHERIA: 'Serralheria',
  VIDRACARIA: 'Vidracaria',
  TELHADO: 'Telhados e Coberturas',
  SEGUROS: 'Corretora de Seguros',
  ADMINISTRACAO: 'Administradora de Condominios',
  OUTRO: 'Outros Servicos',
}

export interface ParceiroEnderecoResponse {
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
}

export interface ParceiroResponse {
  id: string
  nome: string
  nomeFantasia?: string
  cnpj?: string
  cpf?: string
  email?: string
  telefone?: string
  celular?: string
  website?: string
  endereco: ParceiroEnderecoResponse
  categorias: CategoriaParceiro[]
  descricaoServicos?: string
  areaAtuacao?: string
  avaliacao?: number
  totalAvaliacoes?: number
  ativo: boolean
  verificado: boolean
  contatoNome?: string
  contatoCargo?: string
  observacoes?: string
  logoUrl?: string
  createdAt: string
  updatedAt?: string
}

export interface ParceiroListResponse {
  id: string
  nome: string
  nomeFantasia?: string
  email?: string
  telefone?: string
  cidade?: string
  estado?: string
  categorias: CategoriaParceiro[]
  avaliacao?: number
  totalAvaliacoes?: number
  ativo: boolean
  verificado: boolean
  logoUrl?: string
}

export interface CreateParceiroRequest {
  nome: string
  nomeFantasia?: string
  cnpj?: string
  cpf?: string
  email?: string
  telefone?: string
  celular?: string
  website?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  categorias: CategoriaParceiro[]
  descricaoServicos?: string
  areaAtuacao?: string
  contatoNome?: string
  contatoCargo?: string
  observacoes?: string
  logoUrl?: string
}

export interface UpdateParceiroRequest extends Partial<CreateParceiroRequest> {
  ativo?: boolean
  verificado?: boolean
}

export interface ParceiroFilter {
  search?: string
  categoria?: CategoriaParceiro
  cidade?: string
  estado?: string
  ativo?: boolean
  verificado?: boolean
}

export interface CategoriaParceiroResponse {
  codigo: CategoriaParceiro
  descricao: string
}

// ========== BILLING ==========

export interface PlanoResponse {
  id: string
  nome: string
  codigo: string
  descricao?: string
  precoMensal: number
  precoAnual?: number
  maxCondominios?: number
  maxDocumentosMes?: number
  maxUsuarios?: number
  temDiagnostico: boolean
  temAssistenteIa: boolean
  temRag: boolean
  temVistoriaCompleta: boolean
  temLaudoTecnico: boolean
  temParceiros: boolean
  temRelatoriosAvancados: boolean
  temApiAcesso: boolean
  destaque: boolean
}

export interface AssinaturaResponse {
  id: string
  userId: string
  planoId: string
  planoNome?: string
  planoCodigo?: string
  status: string
  dataInicio: string
  dataFim: string
  tipoPagamento: string
  valor: number
}

export interface CreateAssinaturaRequest {
  planoId: string
  tipoPagamento: string
}

// ========== DASHBOARD CHARTS ==========

export interface StatusCount {
  status: string
  count: number
}

export interface TipoCount {
  tipo: string
  count: number
}

export interface MonthCount {
  month: string
  count: number
}

export interface SeguradoraCount {
  seguradora: string
  condominios: number
}

export interface ActivityEvent {
  id: string
  type: 'sinistro' | 'vistoria' | 'documento' | 'notificacao' | 'condominio'
  title: string
  description: string
  timestamp: string
}

export interface DashboardChartsData {
  sinistrosByStatus: StatusCount[]
  documentosByTipo: TipoCount[]
  vistoriasByMonth: MonthCount[]
  topSeguradoras: SeguradoraCount[]
  recentActivity: ActivityEvent[]
}

// ========== USERS MANAGEMENT ==========

export interface UserResponse {
  id: string
  email: string
  name: string
  phone?: string
  role: Role
  organizationId?: string
  organizationName?: string
  emailVerified: boolean
  active: boolean
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export interface UserListResponse {
  id: string
  email: string
  name: string
  phone?: string
  role: Role
  organizationName?: string
  emailVerified: boolean
  active: boolean
}

export interface UserFilter {
  search?: string
  role?: Role
  emailVerified?: boolean
  active?: boolean
}

export interface CreateUserRequest {
  email: string
  password: string
  name: string
  phone?: string
  role: Role
  organizationName?: string
}

export interface UpdateUserRequest {
  name?: string
  phone?: string
  role?: Role
  organizationName?: string
  email?: string
  password?: string
}

// ========== SEGUROS (APOLICES) ==========

export type StatusApoliceType = 'VIGENTE' | 'VENCIDA' | 'CANCELADA' | 'PENDENTE' | 'EM_RENOVACAO'

export type TipoCobertura =
  | 'INCENDIO' | 'RAIO' | 'EXPLOSAO' | 'QUEDA_AERONAVE' | 'FUMACA'
  | 'DANOS_ELETRICOS' | 'VENDAVAL' | 'GRANIZO' | 'IMPACTO_VEICULOS'
  | 'ROUBO' | 'FURTO_QUALIFICADO' | 'RESPONSABILIDADE_CIVIL'
  | 'RC_SINDICO' | 'RC_GUARDA_VEICULOS' | 'RC_PORTOES' | 'RC_EMPREGADOR'
  | 'DANOS_MORAIS' | 'VIDROS' | 'ANUNCIOS_LUMINOSOS' | 'QUEBRA_MAQUINAS'
  | 'EQUIPAMENTOS_ELETRONICOS' | 'DESMORONAMENTO' | 'ALAGAMENTO' | 'INUNDACAO'
  | 'TUMULTOS' | 'GREVES' | 'DESPESAS_FIXAS' | 'PERDA_ALUGUEL'
  | 'VIDA_FUNCIONARIOS' | 'ACIDENTES_PESSOAIS' | 'PORTOES_AUTOMATICOS' | 'OUTRAS'

export interface CoberturaResponse {
  id: string
  tipo: TipoCobertura
  descricao: string
  limiteMaximo?: number
  franquia?: number
  franquiaPercentual?: number
  carenciaDias?: number
  condicoesEspeciais?: string
  exclusoes?: string
  contratada: boolean
  obrigatoria: boolean
  recomendada: boolean
}

export interface ApoliceResponse {
  id: string
  numeroApolice?: string
  condominioId: string
  condominioNome?: string
  seguradoraId?: string
  seguradoraNome?: string
  status: StatusApoliceType
  dataInicio?: string
  dataFim?: string
  premioTotal?: number
  premioLiquido?: number
  iof?: number
  formaPagamento?: string
  numeroParcelas?: number
  valorParcela?: number
  importanciaSeguradaTotal?: number
  documentoId?: string
  propostaId?: string
  corretorNome?: string
  corretorSusep?: string
  corretorTelefone?: string
  corretorEmail?: string
  observacoes?: string
  clausulasEspeciais?: string
  coberturas: CoberturaResponse[]
  createdAt: string
  updatedAt?: string
}

export interface ApoliceListResponse {
  id: string
  numeroApolice?: string
  condominioId?: string
  condominioNome?: string
  seguradoraNome?: string
  status: StatusApoliceType
  dataInicio?: string
  dataFim?: string
  premioTotal?: number
  importanciaSeguradaTotal?: number
  quantidadeCoberturas: number
  diasParaVencimento: number
  vigente: boolean
}

export interface ApoliceFilter {
  search?: string
  condominioId?: string
  seguradoraId?: string
  status?: StatusApoliceType
  vigente?: boolean
  vencendo?: boolean
}

export interface CreateApoliceRequest {
  numeroApolice?: string
  condominioId: string
  seguradoraId?: string
  status?: StatusApoliceType
  dataInicio?: string
  dataFim?: string
  premioTotal?: number
  premioLiquido?: number
  iof?: number
  formaPagamento?: string
  numeroParcelas?: number
  valorParcela?: number
  importanciaSeguradaTotal?: number
  corretorNome?: string
  corretorSusep?: string
  observacoes?: string
}

export interface SeguradoraResponse {
  id: string
  nome: string
  cnpj?: string
  codigoSusep?: string
  telefone?: string
  email?: string
  website?: string
  enderecoCompleto?: string
  logoUrl?: string
  observacoes?: string
  descricao?: string
  especialidades?: string[]
  regras?: string[]
  iaConhecimento?: string[]
  rating?: number
  totalAvaliacoes?: number
  condicoesGeraisUrl?: string
  condicoesGeraisNomeArquivo?: string
  condicoesGeraisAtualizadoEm?: string
  createdAt?: string
}

export interface SeguradoraStatsResponse {
  seguradoraId: string
  seguradoraNome: string
  totalApolices: number
  apolicesVigentes: number
  apolicesVencidas: number
  premioTotalMedio: number
  importanciaSeguradaMedia: number
  totalCoberturas: number
  totalSinistros: number
  totalPrejuizoSinistros: number
  totalIndenizado: number
  totalCondominios: number
}

export interface CreateSeguradoraRequest {
  nome: string
  cnpj?: string
  codigoSusep?: string
  telefone?: string
  email?: string
  website?: string
  enderecoCompleto?: string
  logoUrl?: string
  observacoes?: string
  descricao?: string
  especialidades?: string[]
  regras?: string[]
  iaConhecimento?: string[]
}
