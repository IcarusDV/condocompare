'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Autocomplete,
  LinearProgress,
  Tooltip,
  IconButton,
  Badge,
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import DownloadIcon from '@mui/icons-material/Download'
import PrintIcon from '@mui/icons-material/Print'
import ApartmentIcon from '@mui/icons-material/Apartment'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import AssignmentIcon from '@mui/icons-material/Assignment'
import DescriptionIcon from '@mui/icons-material/Description'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import FilterListIcon from '@mui/icons-material/FilterList'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleIcon from '@mui/icons-material/Schedule'
import { condominioService } from '@/services/condominioService'
import { sinistroService } from '@/services/sinistroService'
import { vistoriaService } from '@/services/vistoriaService'
import { documentoService } from '@/services/documentoService'
import { dashboardService } from '@/services/dashboardService'
import { exportService, ExportColumn } from '@/services/exportService'
import {
  CondominioListResponse,
  DashboardMetricsDTO,
} from '@/types'

type ReportType = 'condominios' | 'sinistros' | 'vistorias' | 'documentos' | 'resumo'
type ExportFormat = 'pdf' | 'excel' | 'csv'

interface ReportConfig {
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
}

const reportConfigs: Record<ReportType, ReportConfig> = {
  condominios: {
    title: 'Condominios',
    subtitle: 'Lista completa cadastrada',
    icon: <ApartmentIcon />,
    color: '#3b82f6',
  },
  sinistros: {
    title: 'Sinistros',
    subtitle: 'Historico de ocorrencias',
    icon: <ReportProblemIcon />,
    color: '#ef4444',
  },
  vistorias: {
    title: 'Vistorias',
    subtitle: 'Agendadas e realizadas',
    icon: <AssignmentIcon />,
    color: '#10b981',
  },
  documentos: {
    title: 'Documentos',
    subtitle: 'Apolices, orcamentos e laudos',
    icon: <DescriptionIcon />,
    color: '#f59e0b',
  },
  resumo: {
    title: 'Resumo Geral',
    subtitle: 'Indicadores e metricas',
    icon: <TrendingUpIcon />,
    color: '#8b5cf6',
  },
}

const condominioColumns: ExportColumn[] = [
  { header: 'Nome', key: 'nome', width: 25 },
  { header: 'CNPJ', key: 'cnpj', width: 18 },
  { header: 'Cidade', key: 'cidade', width: 15 },
  { header: 'Estado', key: 'estado', width: 8 },
  { header: 'Unidades', key: 'numeroUnidades', width: 10 },
  { header: 'Seguradora', key: 'seguradoraAtual', width: 15 },
  { header: 'Status Apolice', key: 'statusApolice', width: 12 },
]

const sinistroColumns: ExportColumn[] = [
  { header: 'Numero', key: 'numeroSinistro', width: 15 },
  { header: 'Condominio', key: 'condominioNome', width: 25 },
  { header: 'Tipo', key: 'tipo', width: 15 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Data Ocorrencia', key: 'dataOcorrencia', width: 15 },
  { header: 'Valor Prejuizo', key: 'valorPrejuizo', width: 15 },
  { header: 'Valor Indenizado', key: 'valorIndenizado', width: 15 },
]

const vistoriaColumns: ExportColumn[] = [
  { header: 'Condominio', key: 'condominioNome', width: 25 },
  { header: 'Tipo', key: 'tipo', width: 12 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Data Agendada', key: 'dataAgendada', width: 15 },
  { header: 'Data Realizada', key: 'dataRealizada', width: 15 },
  { header: 'Responsavel', key: 'responsavelNome', width: 20 },
  { header: 'Nota', key: 'notaGeral', width: 8 },
]

const documentoColumns: ExportColumn[] = [
  { header: 'Nome', key: 'nome', width: 25 },
  { header: 'Tipo', key: 'tipo', width: 12 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Seguradora', key: 'seguradoraNome', width: 18 },
  { header: 'Valor Premio', key: 'valorPremio', width: 15 },
  { header: 'Vencimento', key: 'dataVigenciaFim', width: 15 },
  { header: 'Data Upload', key: 'createdAt', width: 15 },
]

const statusColors: Record<string, string> = {
  VIGENTE: '#22c55e',
  VENCIDA: '#ef4444',
  VENCENDO: '#f59e0b',
  ABERTO: '#3b82f6',
  EM_ANALISE: '#f59e0b',
  APROVADO: '#22c55e',
  NEGADO: '#ef4444',
  CONCLUIDO: '#22c55e',
  CONCLUIDA: '#22c55e',
  PENDENTE: '#94a3b8',
  PROCESSANDO: '#3b82f6',
  AGENDADA: '#3b82f6',
  EM_ANDAMENTO: '#f59e0b',
  CANCELADA: '#94a3b8',
  ERRO: '#ef4444',
}

export default function RelatoriosPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('condominios')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([])
  const [metrics, setMetrics] = useState<DashboardMetricsDTO | null>(null)
  const [condominios, setCondominios] = useState<CondominioListResponse[]>([])
  const [filterCondominio, setFilterCondominio] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({})

  // Load condominios for filter
  useEffect(() => {
    condominioService.list({}, { size: 100 }).then(res => {
      setCondominios(res.content)
    }).catch(() => {})
  }, [])

  // Load initial counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [cond, sin, vis, doc] = await Promise.all([
          condominioService.list({}, { size: 1 }),
          sinistroService.list({}, { size: 1 }),
          vistoriaService.list({}, { size: 1 }),
          documentoService.list({}, { size: 1 }),
        ])
        setRecordCounts({
          condominios: cond.totalElements,
          sinistros: sin.totalElements,
          vistorias: vis.totalElements,
          documentos: doc.totalElements,
        })
      } catch {}
    }
    loadCounts()
  }, [])

  const loadPreviewData = async (reportType: ReportType) => {
    try {
      setLoading(true)
      setError(null)
      setPage(0)

      const condFilter = filterCondominio ? { condominioId: filterCondominio } : {}

      switch (reportType) {
        case 'condominios': {
          const response = await condominioService.list({}, { size: 500 })
          setPreviewData(response.content as unknown as Record<string, unknown>[])
          break
        }
        case 'sinistros': {
          const response = await sinistroService.list(condFilter as Record<string, string>, { size: 500 })
          setPreviewData(response.content as unknown as Record<string, unknown>[])
          break
        }
        case 'vistorias': {
          const response = await vistoriaService.list(condFilter as Record<string, string>, { size: 500 })
          setPreviewData(response.content as unknown as Record<string, unknown>[])
          break
        }
        case 'documentos': {
          const filter = filterCondominio ? { condominioId: filterCondominio } : undefined
          const response = await documentoService.list(filter, { size: 500 })
          setPreviewData(response.content as unknown as Record<string, unknown>[])
          break
        }
        case 'resumo': {
          const data = await dashboardService.getMetrics()
          setMetrics(data)
          setPreviewData([])
          break
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Erro ao carregar dados do relatorio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPreviewData(selectedReport)
  }, [selectedReport, filterCondominio])

  const handleExport = (format: ExportFormat) => {
    const config = reportConfigs[selectedReport]

    if (selectedReport === 'resumo' && metrics) {
      const resumoData = [
        { metrica: 'Total de Condominios', valor: metrics.totalCondominios },
        { metrica: 'Total de Documentos', valor: metrics.totalDocumentos },
        { metrica: 'Total de Vistorias', valor: metrics.totalVistorias },
        { metrica: 'Total de Sinistros', valor: metrics.totalSinistros },
        { metrica: 'Apolices Vigentes', valor: metrics.totalApolices },
        { metrica: 'Orcamentos Cadastrados', valor: metrics.totalOrcamentos },
        { metrica: 'Apolices Vencendo (30 dias)', valor: metrics.apolicesVencendo30dias },
        { metrica: 'Vistorias Agendadas', valor: metrics.vistoriasAgendadas },
        { metrica: 'Vistorias Concluidas', valor: metrics.vistoriasConcluidas },
        { metrica: 'Sinistros Abertos', valor: metrics.sinistrosAbertos },
        { metrica: 'Sinistros em Analise', valor: metrics.sinistrosEmAnalise },
        { metrica: 'Valor Total Prejuizos', valor: formatCurrency(metrics.valorTotalPrejuizos) },
        { metrica: 'Valor Total Indenizado', valor: formatCurrency(metrics.valorTotalIndenizado) },
      ]

      const columns: ExportColumn[] = [
        { header: 'Metrica', key: 'metrica', width: 30 },
        { header: 'Valor', key: 'valor', width: 20 },
      ]

      const options = {
        title: 'Resumo Geral - CondoCompare',
        subtitle: `Dados atualizados em ${new Date().toLocaleDateString('pt-BR')}`,
        columns,
        data: resumoData as Record<string, unknown>[],
        filename: `resumo_geral_${new Date().toISOString().split('T')[0]}`,
      }

      exportByFormat(format, options)
      return
    }

    const columns = getColumns()
    const options = {
      title: `${config.title} - CondoCompare`,
      subtitle: `Total de ${previewData.length} registros | Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
      columns,
      data: previewData,
      filename: `${selectedReport}_${new Date().toISOString().split('T')[0]}`,
    }
    exportByFormat(format, options)
  }

  const exportByFormat = (format: ExportFormat, options: Parameters<typeof exportService.exportToPDF>[0]) => {
    switch (format) {
      case 'pdf': exportService.exportToPDF(options); break
      case 'excel': exportService.exportToExcel(options); break
      case 'csv': exportService.exportToCSV(options); break
    }
  }

  const getColumns = (): ExportColumn[] => {
    switch (selectedReport) {
      case 'condominios': return condominioColumns
      case 'sinistros': return sinistroColumns
      case 'vistorias': return vistoriaColumns
      case 'documentos': return documentoColumns
      default: return []
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '-'
    try {
      return new Date(value).toLocaleDateString('pt-BR')
    } catch {
      return value
    }
  }

  const formatCellValue = (key: string, value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return '-'

    // Currency fields
    if (['valorPrejuizo', 'valorIndenizado', 'valorPremio'].includes(key)) {
      return formatCurrency(value as number)
    }

    // Date fields
    if (['dataOcorrencia', 'dataAgendada', 'dataRealizada', 'dataVigenciaFim', 'createdAt'].includes(key)) {
      return formatDate(value as string)
    }

    // Status fields with colored chips
    if (['status', 'statusApolice'].includes(key)) {
      const strValue = String(value)
      const color = statusColors[strValue] || '#94a3b8'
      return (
        <Chip
          label={strValue.replace(/_/g, ' ')}
          size="small"
          sx={{
            bgcolor: `${color}18`,
            color,
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 24,
          }}
        />
      )
    }

    // Tipo fields
    if (key === 'tipo') {
      const labels: Record<string, string> = {
        APOLICE: 'Apolice',
        ORCAMENTO: 'Orcamento',
        CONDICOES_GERAIS: 'Cond. Gerais',
        LAUDO_VISTORIA: 'Laudo',
        SINISTRO: 'Sinistro',
        OUTRO: 'Outro',
        BASICA: 'Basica',
        INTERMEDIARIA: 'Intermediaria',
        COMPLETA: 'Completa',
        INCENDIO: 'Incendio',
        ALAGAMENTO: 'Alagamento',
        ROUBO: 'Roubo',
        DANO_ELETRICO: 'Dano Eletrico',
        RESPONSABILIDADE_CIVIL: 'Resp. Civil',
        VENDAVAL: 'Vendaval',
      }
      return labels[String(value)] || String(value)
    }

    // Nota field
    if (key === 'notaGeral') {
      const nota = Number(value)
      const color = nota >= 8 ? '#22c55e' : nota >= 6 ? '#f59e0b' : '#ef4444'
      return (
        <Typography variant="body2" fontWeight={700} sx={{ color }}>
          {nota.toFixed(1)}
        </Typography>
      )
    }

    return String(value)
  }

  const selectedCondominio = condominios.find(c => c.id === filterCondominio)
  const showCondominioFilter = selectedReport !== 'condominios' && selectedReport !== 'resumo'

  const paginatedData = useMemo(() => {
    return previewData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [previewData, page, rowsPerPage])

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Relatorios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gere e exporte relatorios do sistema
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Imprimir">
            <IconButton onClick={() => window.print()} sx={{ border: '1px solid #e2e8f0' }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Atualizar dados">
            <IconButton onClick={() => loadPreviewData(selectedReport)} sx={{ border: '1px solid #e2e8f0' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Report Type Tabs */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {(Object.keys(reportConfigs) as ReportType[]).map((type) => {
          const config = reportConfigs[type]
          const isSelected = selectedReport === type
          const count = recordCounts[type]
          return (
            <Card
              key={type}
              onClick={() => setSelectedReport(type)}
              sx={{
                cursor: 'pointer',
                flex: '1 1 160px',
                minWidth: 160,
                border: isSelected ? `2px solid ${config.color}` : '1px solid #e2e8f0',
                bgcolor: isSelected ? `${config.color}08` : 'white',
                boxShadow: isSelected ? `0 0 0 1px ${config.color}30` : 'none',
                '&:hover': { borderColor: config.color, transform: 'translateY(-1px)' },
                transition: 'all 0.2s',
              }}
            >
              <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: isSelected ? config.color : `${config.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? 'white' : config.color,
                      transition: 'all 0.2s',
                    }}
                  >
                    {config.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {config.title}
                      </Typography>
                      {count !== undefined && type !== 'resumo' && (
                        <Chip
                          label={count}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            bgcolor: isSelected ? config.color : `${config.color}20`,
                            color: isSelected ? 'white' : config.color,
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {config.subtitle}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {/* Main Content */}
      <Paper sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
        {/* Toolbar */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
            <Box>
              <Typography variant="h6" fontWeight="600">
                {reportConfigs[selectedReport].title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedReport === 'resumo'
                  ? 'Indicadores gerais do sistema'
                  : loading
                    ? 'Carregando...'
                    : `${previewData.length} registros encontrados`}
              </Typography>
            </Box>

            {showCondominioFilter && (
              <Autocomplete
                options={condominios}
                getOptionLabel={(option) => option.nome}
                value={selectedCondominio || null}
                onChange={(_, newValue) => setFilterCondominio(newValue?.id || '')}
                size="small"
                sx={{ width: 280 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Filtrar por condominio..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <FilterListIcon sx={{ color: 'grey.400', mr: 0.5, fontSize: 20 }} />,
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Typography variant="body2">{option.nome}</Typography>
                  </li>
                )}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleExport('pdf')}
              disabled={loading}
              sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, textTransform: 'none' }}
            >
              PDF
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<TableChartIcon />}
              onClick={() => handleExport('excel')}
              disabled={loading}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none' }}
            >
              Excel
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('csv')}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              CSV
            </Button>
          </Box>
        </Box>

        {loading && <LinearProgress />}
        <Divider />

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, flexDirection: 'column', gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">Carregando dados...</Typography>
          </Box>
        ) : selectedReport === 'resumo' && metrics ? (
          <Box sx={{ p: 3 }}>
            {/* Main Metrics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Condominios', value: metrics.totalCondominios, color: '#3b82f6', icon: <ApartmentIcon /> },
                { label: 'Documentos', value: metrics.totalDocumentos, color: '#f59e0b', icon: <DescriptionIcon /> },
                { label: 'Vistorias', value: metrics.totalVistorias, color: '#10b981', icon: <AssignmentIcon /> },
                { label: 'Sinistros', value: metrics.totalSinistros, color: '#ef4444', icon: <ReportProblemIcon /> },
              ].map((item) => (
                <Grid item xs={6} md={3} key={item.label}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: `${item.color}12`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" lineHeight={1}>
                        {item.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.label}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Status Section */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Apolices
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: '#22c55e' }} />
                        <Typography variant="body2">Vigentes</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>{metrics.totalApolices}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningAmberIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                        <Typography variant="body2">Vencendo (30d)</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: metrics.apolicesVencendo30dias > 0 ? '#f59e0b' : 'inherit' }}>
                        {metrics.apolicesVencendo30dias}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                        <Typography variant="body2">Orcamentos</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>{metrics.totalOrcamentos}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Vistorias
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                        <Typography variant="body2">Agendadas</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>{metrics.vistoriasAgendadas}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: '#22c55e' }} />
                        <Typography variant="body2">Concluidas</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>{metrics.vistoriasConcluidas}</Typography>
                    </Box>
                    {metrics.totalVistorias > 0 && (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Conclusao</Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {Math.round((metrics.vistoriasConcluidas / metrics.totalVistorias) * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(metrics.vistoriasConcluidas / metrics.totalVistorias) * 100}
                          sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#22c55e' } }}
                        />
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Sinistros
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReportProblemIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                        <Typography variant="body2">Abertos</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: metrics.sinistrosAbertos > 0 ? '#ef4444' : 'inherit' }}>
                        {metrics.sinistrosAbertos}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningAmberIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                        <Typography variant="body2">Em Analise</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>{metrics.sinistrosEmAnalise}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">Notificacoes</Typography>
                      </Box>
                      <Badge badgeContent={metrics.notificacoesNaoLidas} color="error" max={99}>
                        <Typography variant="body2" fontWeight={700}>nao lidas</Typography>
                      </Badge>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Financial Summary */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: '#fef2f2',
                    borderRadius: 2,
                    border: '1px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingDownIcon sx={{ color: '#ef4444' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Valor Total Prejuizos
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="#ef4444">
                      {formatCurrency(metrics.valorTotalPrejuizos)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: '#f0fdf4',
                    borderRadius: 2,
                    border: '1px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUpIcon sx={{ color: '#22c55e' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Valor Total Indenizado
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="#22c55e">
                      {formatCurrency(metrics.valorTotalIndenizado)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          /* Data Table */
          <>
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {getColumns().map((col) => (
                      <TableCell
                        key={col.key}
                        sx={{
                          fontWeight: 700,
                          bgcolor: '#f8fafc',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: '#64748b',
                          borderBottom: '2px solid #e2e8f0',
                        }}
                      >
                        {col.header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row, idx) => (
                    <TableRow
                      key={idx}
                      hover
                      sx={{
                        '&:hover': { bgcolor: '#f8fafc' },
                        '& td': { borderColor: '#f1f5f9' },
                      }}
                    >
                      {getColumns().map((col) => (
                        <TableCell key={col.key} sx={{ py: 1.2 }}>
                          {formatCellValue(col.key, row[col.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {previewData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={getColumns().length} align="center" sx={{ py: 6 }}>
                        <DescriptionIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                        <Typography color="text.secondary">Nenhum registro encontrado</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {previewData.length > 0 && (
              <TablePagination
                component="div"
                count={previewData.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
                rowsPerPageOptions={[10, 15, 25, 50]}
                labelRowsPerPage="Linhas por pagina:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                sx={{ borderTop: '1px solid #e2e8f0' }}
              />
            )}
          </>
        )}
      </Paper>
    </Box>
  )
}
