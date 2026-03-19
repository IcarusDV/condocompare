'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Skeleton,
  CircularProgress,
  TablePagination,
  Tooltip,
  InputAdornment,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DescriptionIcon from '@mui/icons-material/Description'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import PaidIcon from '@mui/icons-material/Paid'
import GavelIcon from '@mui/icons-material/Gavel'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt'
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt'
import SpeedIcon from '@mui/icons-material/Speed'
import BarChartIcon from '@mui/icons-material/BarChart'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext'
import { iaService } from '@/services/iaService'
import { exportService } from '@/services/exportService'
import {
  getTipoSinistroLabel,
  getStatusSinistroLabel,
} from '@/services/sinistroService'
import {
  CreateSinistroRequest,
  TipoSinistro,
  StatusSinistro,
} from '@/types'
import { exportToCsv } from '@/utils/exportCsv'
import { useSinistros, useCreateSinistro, useDeleteSinistro, useSinistroStats } from '@/hooks/queries/useSinistros'
import { useCondominios } from '@/hooks/queries/useCondominios'

interface SinistroHelpData {
  documentos_necessarios: string[]
  passos_imediatos: string[]
  prazo_estimado: string
  dicas: string[]
  cuidados: string[]
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  ABERTO: { color: '#f59e0b', bg: '#fef3c7' },
  EM_ANALISE: { color: '#3b82f6', bg: '#dbeafe' },
  APROVADO: { color: '#22c55e', bg: '#dcfce7' },
  NEGADO: { color: '#ef4444', bg: '#fee2e2' },
  PAGO: { color: '#10b981', bg: '#d1fae5' },
  CANCELADO: { color: '#94a3b8', bg: '#f1f5f9' },
}

const getDiasAberto = (dataOcorrencia: string): number => {
  const diff = Date.now() - new Date(dataOcorrencia).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const getDiasColor = (dias: number): string => {
  if (dias > 90) return '#ef4444'
  if (dias > 60) return '#f59e0b'
  if (dias > 30) return '#3b82f6'
  return '#94a3b8'
}

const getDiasBg = (dias: number): string => {
  if (dias > 90) return '#fef2f2'
  if (dias > 60) return '#fffbeb'
  if (dias > 30) return '#eff6ff'
  return '#f8fafc'
}

const getStatusProgress = (status: StatusSinistro): number => {
  const map: Record<StatusSinistro, number> = {
    ABERTO: 20,
    EM_ANALISE: 50,
    APROVADO: 75,
    PAGO: 100,
    NEGADO: 100,
    CANCELADO: 100,
  }
  return map[status] ?? 0
}

const getStatusProgressColor = (status: StatusSinistro): string => {
  if (status === 'NEGADO') return '#ef4444'
  if (status === 'CANCELADO') return '#94a3b8'
  if (status === 'PAGO') return '#10b981'
  return '#6366f1'
}

export default function SinistrosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { confirm: confirmDialog } = useConfirmDialog()
  const canRegisterSinistro = !!user
  const canDelete = user?.role === 'CORRETORA' || user?.role === 'ADMIN'
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)

  // IA Help
  const [iaHelp, setIaHelp] = useState<SinistroHelpData | null>(null)
  const [iaHelpLoading, setIaHelpLoading] = useState(false)
  const [showIaHelp, setShowIaHelp] = useState(false)
  const [formData, setFormData] = useState<CreateSinistroRequest>({
    condominioId: '',
    tipo: 'OUTROS',
    dataOcorrencia: '',
    descricao: '',
    localOcorrencia: '',
    valorPrejuizo: undefined,
    coberturaAcionada: '',
    observacoes: '',
  })

  // Filters
  const [filterCondominioId, setFilterCondominioId] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusSinistro | ''>('')
  const [filterTipo, setFilterTipo] = useState<TipoSinistro | ''>('')
  const [search, setSearch] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Chart toggle
  const [showChart, setShowChart] = useState(false)

  const sinistroFilter = useMemo(() => ({
    condominioId: filterCondominioId || undefined,
    status: filterStatus || undefined,
    tipo: filterTipo || undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
  }), [filterCondominioId, filterStatus, filterTipo, dataInicio, dataFim])

  const sinistrosPagination = useMemo(() => ({ page, size: rowsPerPage }), [page, rowsPerPage])

  const { data: sinistrosPage, isLoading: loading, error: queryError } = useSinistros(sinistroFilter, sinistrosPagination)
  const { data: stats } = useSinistroStats()
  const { data: condominiosPage } = useCondominios()
  const createSinistro = useCreateSinistro()
  const deleteSinistroMutation = useDeleteSinistro()

  const sinistros = sinistrosPage?.content ?? []
  const totalElements = sinistrosPage?.totalElements ?? 0
  const condominios = condominiosPage?.content ?? []
  const error = queryError ? 'Erro ao carregar dados' : null
  const saving = createSinistro.isPending

  const filteredSinistros = sinistros.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.condominioNome.toLowerCase().includes(q) ||
      (s.numeroSinistro || '').toLowerCase().includes(q) ||
      s.descricao.toLowerCase().includes(q)
    )
  })

  const handleOpenDialog = () => {
    setFormData({
      condominioId: '',
      tipo: 'OUTROS',
      dataOcorrencia: '',
      descricao: '',
      localOcorrencia: '',
      valorPrejuizo: undefined,
      coberturaAcionada: '',
      observacoes: '',
    })
    setIaHelp(null)
    setShowIaHelp(false)
    setDialogOpen(true)
  }

  const handleGetIaHelp = async () => {
    try {
      setIaHelpLoading(true)
      const result = await iaService.getSinistroHelp(formData.tipo, formData.descricao)
      if (result.success && result.data) {
        setIaHelp(result.data)
        setShowIaHelp(true)
      }
    } catch (err) {
      console.error('Error getting IA help:', err)
    } finally {
      setIaHelpLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await createSinistro.mutateAsync(formData)
      setDialogOpen(false)
    } catch (err) {
      console.error('Error saving:', err)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const ok = await confirmDialog({
      title: 'Confirmar exclusao',
      message: 'Tem certeza que deseja excluir este sinistro?',
      severity: 'error',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    })
    if (!ok) return
    try {
      await deleteSinistroMutation.mutateAsync(id)
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    const columns = [
      { header: 'Condominio', key: 'condominioNome', width: 25 },
      { header: 'N Sinistro', key: 'numeroSinistro', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Data Ocorrencia', key: 'dataOcorrencia', width: 15 },
      { header: 'Valor Prejuizo', key: 'valorPrejuizo', width: 15 },
      { header: 'Valor Indenizado', key: 'valorIndenizado', width: 15 },
    ]
    const options = {
      title: 'Relatorio de Sinistros - CondoCompare',
      subtitle: `${sinistros.length} registros | ${new Date().toLocaleDateString('pt-BR')}`,
      columns,
      data: sinistros as unknown as Record<string, unknown>[],
      filename: `sinistros_${new Date().toISOString().split('T')[0]}`,
    }
    if (format === 'pdf') exportService.exportToPDF(options)
    else exportService.exportToExcel(options)
  }

  const handleExportCSV = () => {
    if (!sinistros.length) return
    const columns = [
      { key: 'protocolo', label: 'Protocolo' },
      { key: 'condominio', label: 'Condominio' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'status', label: 'Status' },
      { key: 'valor', label: 'Valor Prejuizo' },
      { key: 'data', label: 'Data Ocorrencia' },
    ]
    const csvData = sinistros.map(s => ({
      protocolo: s.numeroSinistro || '',
      condominio: s.condominioNome,
      tipo: getTipoSinistroLabel(s.tipo),
      status: getStatusSinistroLabel(s.status),
      valor: s.valorPrejuizo != null
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.valorPrejuizo)
        : '',
      data: s.dataOcorrencia,
    }))
    exportToCsv(csvData, `sinistros_${new Date().toISOString().split('T')[0]}`, columns)
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR')

  const formatCurrency = (value?: number) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const chartMax = stats?.sinistrosPorMes?.reduce((max, m) => Math.max(max, m.total), 0) || 1

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Sinistros</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Acompanhe e gerencie os sinistros dos condominios
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />} onClick={handleExportCSV} disabled={!sinistros.length}>CSV</Button>
          <Button variant="outlined" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => handleExport('pdf')} sx={{ borderColor: '#ef4444', color: '#ef4444' }}>PDF</Button>
          <Button variant="outlined" size="small" startIcon={<TableChartIcon />} onClick={() => handleExport('excel')} sx={{ borderColor: '#10b981', color: '#10b981' }}>Excel</Button>
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} onClick={() => router.push('/dashboard/assistente?context=sinistro&from=sinistros')} sx={{ borderColor: '#6366f1', color: '#6366f1' }}>Ajuda IA</Button>
          {canRegisterSinistro && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog} sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>Registrar Sinistro</Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Row 1: Status counts */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: 'Total', value: String(stats?.total ?? 0), icon: <ReportProblemIcon />, color: '#6366f1' },
          { label: 'Abertos', value: String(stats?.abertos ?? 0), icon: <AccessTimeIcon />, color: '#f59e0b' },
          { label: 'Em Analise', value: String(stats?.emAnalise ?? 0), icon: <GavelIcon />, color: '#3b82f6' },
          { label: 'Aprovados', value: String(stats?.aprovados ?? 0), icon: <ThumbUpAltIcon />, color: '#22c55e' },
          { label: 'Negados', value: String(stats?.negados ?? 0), icon: <ThumbDownAltIcon />, color: '#ef4444' },
          { label: 'Pagos', value: String(stats?.pagos ?? 0), icon: <PaidIcon />, color: '#10b981' },
        ].map((stat) => (
          <Grid item xs={6} md={2} key={stat.label}>
            <Paper sx={{ p: 1.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, '& svg': { fontSize: 18 } }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>{stat.value}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{stat.label}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Stats Row 2: KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#6366f112', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                <SpeedIcon />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" lineHeight={1.2}>
                  {stats?.tempoMedioResolucaoDias ? `${stats.tempoMedioResolucaoDias}d` : '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">Tempo Medio Resolucao</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#22c55e12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                <TrendingUpIcon />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography variant="h5" fontWeight="bold" lineHeight={1.2} sx={{ color: '#22c55e' }}>
                    {stats?.taxaAprovacao != null ? `${stats.taxaAprovacao}%` : '-'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#ef4444' }}>
                    / {stats?.taxaNegacao != null ? `${stats.taxaNegacao}%` : '-'}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">Aprovacao / Negacao</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, border: '1px solid #fecaca', boxShadow: 'none', bgcolor: '#fef2f2' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <WarningAmberIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" lineHeight={1.2} sx={{ color: '#ef4444' }}>
                  {formatCurrency(stats?.totalPrejuizo)}
                </Typography>
                <Typography variant="caption" color="text.secondary">Total Prejuizo</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, border: '1px solid #bbf7d0', boxShadow: 'none', bgcolor: '#f0fdf4' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#22c55e20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                <PaidIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" lineHeight={1.2} sx={{ color: '#22c55e' }}>
                  {formatCurrency(stats?.totalIndenizado)}
                </Typography>
                <Typography variant="caption" color="text.secondary">Total Indenizado</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Mini Chart */}
      {stats?.sinistrosPorMes && stats.sinistrosPorMes.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: showChart ? 2 : 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChartIcon sx={{ color: '#6366f1', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight="bold">Sinistros por Mes</Typography>
              <Chip label={`${stats.sinistrosPorMes.length} meses`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#ede9fe', color: '#6366f1' }} />
            </Box>
            <Button size="small" onClick={() => setShowChart(!showChart)} sx={{ color: '#6366f1', textTransform: 'none', fontSize: '0.75rem' }}>
              {showChart ? 'Ocultar' : 'Expandir'}
            </Button>
          </Box>
          {showChart && (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 120, px: 1 }}>
              {stats.sinistrosPorMes.map((m) => (
                <Tooltip key={m.mes} title={`${m.mes}: ${m.total} sinistro(s)`} arrow>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>{m.total}</Typography>
                    <Box sx={{
                      width: '100%',
                      maxWidth: 40,
                      height: `${Math.max((m.total / chartMax) * 80, 4)}px`,
                      bgcolor: '#6366f1',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 4,
                      transition: 'all 0.3s ease',
                      '&:hover': { bgcolor: '#4f46e5', transform: 'scaleY(1.05)' },
                    }} />
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                      {m.mes.slice(5)}
                    </Typography>
                  </Box>
                </Tooltip>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField fullWidth size="small" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'grey.400' }} /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Condominio</InputLabel>
              <Select value={filterCondominioId} label="Condominio" onChange={(e) => { setFilterCondominioId(e.target.value); setPage(0) }}>
                <MenuItem value="">Todos</MenuItem>
                {condominios.map((c) => (<MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select value={filterTipo} label="Tipo" onChange={(e) => { setFilterTipo(e.target.value as TipoSinistro | ''); setPage(0) }}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="INCENDIO">Incendio</MenuItem>
                <MenuItem value="ROUBO">Roubo</MenuItem>
                <MenuItem value="DANOS_AGUA">Danos por Agua</MenuItem>
                <MenuItem value="DANOS_ELETRICOS">Danos Eletricos</MenuItem>
                <MenuItem value="RESPONSABILIDADE_CIVIL">Resp. Civil</MenuItem>
                <MenuItem value="VENDAVAL">Vendaval</MenuItem>
                <MenuItem value="OUTROS">Outros</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => { setFilterStatus(e.target.value as StatusSinistro | ''); setPage(0) }}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ABERTO">Aberto</MenuItem>
                <MenuItem value="EM_ANALISE">Em Analise</MenuItem>
                <MenuItem value="APROVADO">Aprovado</MenuItem>
                <MenuItem value="NEGADO">Negado</MenuItem>
                <MenuItem value="PAGO">Pago</MenuItem>
                <MenuItem value="CANCELADO">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField fullWidth size="small" label="De" type="date" value={dataInicio}
              onChange={(e) => { setDataInicio(e.target.value); setPage(0) }}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField fullWidth size="small" label="Ate" type="date" value={dataFim}
              onChange={(e) => { setDataFim(e.target.value); setPage(0) }}
              InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <TableContainer>
          {loading ? (
            <Box>
              <Skeleton variant="rectangular" height={48} animation="wave" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={52} animation="wave" sx={{ mt: '1px' }} />
              ))}
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Condominio', 'N Sinistro', 'Tipo', 'Status', 'Progresso', 'Data', 'Dias', 'Prejuizo', 'Indenizado', 'Acoes'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748b', bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSinistros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <ReportProblemIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                      <Typography color="text.secondary">Nenhum sinistro encontrado</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSinistros.map((sinistro) => {
                    const dias = getDiasAberto(sinistro.dataOcorrencia)
                    const isOpen = sinistro.status === 'ABERTO' || sinistro.status === 'EM_ANALISE'
                    const sc = statusConfig[sinistro.status] || statusConfig.CANCELADO
                    const progress = getStatusProgress(sinistro.status)
                    const progressColor = getStatusProgressColor(sinistro.status)
                    return (
                      <TableRow key={sinistro.id} hover onClick={() => router.push(`/dashboard/sinistros/${sinistro.id}`)}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' }, '& td': { borderColor: '#f1f5f9' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sinistro.condominioNome}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#6366f1', fontSize: '0.8rem' }}>
                            {sinistro.numeroSinistro || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{getTipoSinistroLabel(sinistro.tipo)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusSinistroLabel(sinistro.status)}
                            size="small"
                            sx={{
                              bgcolor: sc.bg,
                              color: sc.color,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24,
                              textDecoration: sinistro.status === 'NEGADO' ? 'line-through' : 'none',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 80 }}>
                          <Tooltip title={`${getStatusSinistroLabel(sinistro.status)} (${progress}%)`}>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': { bgcolor: progressColor, borderRadius: 3 },
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(sinistro.dataOcorrencia)}</Typography>
                        </TableCell>
                        <TableCell>
                          {isOpen ? (
                            <Tooltip title={`${dias} dias desde a ocorrencia${dias > 90 ? ' - CRITICO!' : dias > 60 ? ' - Atencao' : ''}`}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {dias > 90 && <LocalFireDepartmentIcon sx={{ fontSize: 14, color: '#ef4444' }} />}
                                <Chip
                                  label={`${dias}d`}
                                  size="small"
                                  sx={{
                                    bgcolor: getDiasBg(dias),
                                    color: getDiasColor(dias),
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    height: 22,
                                    border: dias > 90 ? '1px solid #fecaca' : 'none',
                                  }}
                                />
                              </Box>
                            </Tooltip>
                          ) : <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>-</Typography>}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={sinistro.valorPrejuizo ? 600 : 400} sx={{ color: sinistro.valorPrejuizo ? '#ef4444' : 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {formatCurrency(sinistro.valorPrejuizo)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={sinistro.valorIndenizado ? 600 : 400} sx={{ color: sinistro.valorIndenizado ? '#22c55e' : 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {formatCurrency(sinistro.valorIndenizado)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Visualizar detalhes">
                              <IconButton size="small" onClick={() => router.push(`/dashboard/sinistros/${sinistro.id}`)} sx={{ color: '#6366f1' }}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {canDelete && (
                              <Tooltip title="Excluir">
                                <IconButton size="small" color="error" onClick={(e) => handleDelete(e, sinistro.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <TablePagination component="div" count={totalElements} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
          rowsPerPageOptions={[10, 15, 25]} labelRowsPerPage="Linhas por pagina:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{ borderTop: '1px solid #e2e8f0' }} />
      </Paper>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Registrar Sinistro</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required><InputLabel>Condominio</InputLabel>
                <Select value={formData.condominioId} label="Condominio" onChange={(e) => setFormData(p => ({ ...p, condominioId: e.target.value }))}>
                  {condominios.map((c) => (<MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required><InputLabel>Tipo</InputLabel>
                <Select value={formData.tipo} label="Tipo" onChange={(e) => setFormData(p => ({ ...p, tipo: e.target.value as TipoSinistro }))}>
                  <MenuItem value="INCENDIO">Incendio</MenuItem><MenuItem value="ROUBO">Roubo</MenuItem>
                  <MenuItem value="DANOS_AGUA">Danos por Agua</MenuItem><MenuItem value="DANOS_ELETRICOS">Danos Eletricos</MenuItem>
                  <MenuItem value="RESPONSABILIDADE_CIVIL">Responsabilidade Civil</MenuItem><MenuItem value="VENDAVAL">Vendaval</MenuItem>
                  <MenuItem value="OUTROS">Outros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Data da Ocorrencia" type="datetime-local" value={formData.dataOcorrencia} onChange={(e) => setFormData(p => ({ ...p, dataOcorrencia: e.target.value }))} InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Local da Ocorrencia" value={formData.localOcorrencia} onChange={(e) => setFormData(p => ({ ...p, localOcorrencia: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Descricao" multiline rows={3} value={formData.descricao} onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Valor Estimado do Prejuizo (R$)" type="number" value={formData.valorPrejuizo || ''} onChange={(e) => setFormData(p => ({ ...p, valorPrejuizo: e.target.value ? parseFloat(e.target.value) : undefined }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Cobertura Acionada" value={formData.coberturaAcionada} onChange={(e) => setFormData(p => ({ ...p, coberturaAcionada: e.target.value }))} placeholder="Ex: Incendio, Raio e Explosao" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Observacoes" multiline rows={2} value={formData.observacoes} onChange={(e) => setFormData(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>

            {/* IA Help */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)', border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartToyIcon sx={{ color: '#6366f1' }} />
                    <Typography variant="subtitle2" fontWeight="bold">Orientacoes da IA</Typography>
                    <Chip label="Beta" size="small" sx={{ bgcolor: '#6366f1', color: 'white', height: 20, fontSize: '0.7rem' }} />
                  </Box>
                  <Button size="small" variant="contained" startIcon={iaHelpLoading ? <CircularProgress size={14} color="inherit" /> : <TipsAndUpdatesIcon />} onClick={handleGetIaHelp} disabled={iaHelpLoading || formData.tipo === 'OUTROS'} sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                    {iaHelpLoading ? 'Analisando...' : 'Gerar Orientacoes'}
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary">Selecione o tipo do sinistro para receber orientacoes personalizadas da IA</Typography>
                {iaHelpLoading && <LinearProgress sx={{ mt: 2 }} />}
                {iaHelp && showIaHelp && (
                  <Box sx={{ mt: 2 }}>
                    <Accordion defaultExpanded><AccordionSummary expandIcon={<ExpandMoreIcon />}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CheckCircleOutlineIcon sx={{ color: '#22c55e' }} fontSize="small" /><Typography variant="subtitle2" fontWeight="bold">Passos Imediatos</Typography></Box></AccordionSummary>
                      <AccordionDetails><List dense disablePadding>{iaHelp.passos_imediatos.map((p, i) => (<ListItem key={i} disablePadding><ListItemIcon sx={{ minWidth: 28 }}><Typography variant="body2" fontWeight="bold" color="primary">{i + 1}.</Typography></ListItemIcon><ListItemText primary={p} primaryTypographyProps={{ variant: 'body2' }} /></ListItem>))}</List></AccordionDetails>
                    </Accordion>
                    <Accordion><AccordionSummary expandIcon={<ExpandMoreIcon />}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><DescriptionIcon sx={{ color: '#3b82f6' }} fontSize="small" /><Typography variant="subtitle2" fontWeight="bold">Documentos Necessarios</Typography></Box></AccordionSummary>
                      <AccordionDetails><List dense disablePadding>{iaHelp.documentos_necessarios.map((d, i) => (<ListItem key={i} disablePadding><ListItemIcon sx={{ minWidth: 28 }}><CheckCircleOutlineIcon fontSize="small" color="action" /></ListItemIcon><ListItemText primary={d} primaryTypographyProps={{ variant: 'body2' }} /></ListItem>))}</List></AccordionDetails>
                    </Accordion>
                    <Accordion><AccordionSummary expandIcon={<ExpandMoreIcon />}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TipsAndUpdatesIcon sx={{ color: '#f59e0b' }} fontSize="small" /><Typography variant="subtitle2" fontWeight="bold">Dicas</Typography></Box></AccordionSummary>
                      <AccordionDetails><List dense disablePadding>{iaHelp.dicas.map((d, i) => (<ListItem key={i} disablePadding><ListItemIcon sx={{ minWidth: 28 }}><TipsAndUpdatesIcon fontSize="small" sx={{ color: '#f59e0b' }} /></ListItemIcon><ListItemText primary={d} primaryTypographyProps={{ variant: 'body2' }} /></ListItem>))}</List></AccordionDetails>
                    </Accordion>
                    <Accordion><AccordionSummary expandIcon={<ExpandMoreIcon />}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><WarningAmberIcon sx={{ color: '#ef4444' }} fontSize="small" /><Typography variant="subtitle2" fontWeight="bold">Cuidados</Typography></Box></AccordionSummary>
                      <AccordionDetails><List dense disablePadding>{iaHelp.cuidados.map((c, i) => (<ListItem key={i} disablePadding><ListItemIcon sx={{ minWidth: 28 }}><WarningAmberIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon><ListItemText primary={c} primaryTypographyProps={{ variant: 'body2' }} /></ListItem>))}</List></AccordionDetails>
                    </Accordion>
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#eff6ff', borderRadius: 1 }}><Typography variant="body2" color="text.secondary"><strong>Prazo estimado:</strong> {iaHelp.prazo_estimado}</Typography></Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !formData.condominioId || !formData.dataOcorrencia || !formData.descricao} sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
            {saving ? 'Salvando...' : 'Registrar Sinistro'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
