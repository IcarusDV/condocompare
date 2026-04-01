'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ApartmentIcon from '@mui/icons-material/Apartment'
import PersonIcon from '@mui/icons-material/Person'
import SecurityIcon from '@mui/icons-material/Security'
import PoolIcon from '@mui/icons-material/Pool'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import CelebrationIcon from '@mui/icons-material/Celebration'
import ChildCareIcon from '@mui/icons-material/ChildCare'
import OutdoorGrillIcon from '@mui/icons-material/OutdoorGrill'
import SportsTennisIcon from '@mui/icons-material/SportsTennis'
import SolarPowerIcon from '@mui/icons-material/SolarPower'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorIcon from '@mui/icons-material/Error'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import DescriptionIcon from '@mui/icons-material/Description'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DownloadIcon from '@mui/icons-material/Download'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import SyncIcon from '@mui/icons-material/Sync'
import AddIcon from '@mui/icons-material/Add'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import MapIcon from '@mui/icons-material/Map'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import GppGoodIcon from '@mui/icons-material/GppGood'
import AssignmentIcon from '@mui/icons-material/Assignment'
import Skeleton from '@mui/material/Skeleton'
import { condominioService } from '@/services/condominioService'
import { documentoService, getTipoDocumentoLabel, formatFileSize, getStatusColor, getStatusLabel } from '@/services/documentoService'
import { iaService } from '@/services/iaService'
import { vistoriaService, getTipoVistoriaLabel, getStatusVistoriaLabel, getStatusVistoriaColor } from '@/services/vistoriaService'
import { sinistroService, getTipoSinistroLabel, getStatusSinistroLabel, getStatusSinistroColor } from '@/services/sinistroService'
import { apoliceService, getStatusApoliceLabel, getStatusApoliceColor } from '@/services/apoliceService'
import { CondominioResponse, StatusApolice, DocumentoListResponse, VistoriaListResponse, SinistroListResponse, ApoliceListResponse, ApoliceResponse } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext'
import { DocumentoUploadDialog } from '@/components/documentos/DocumentoUploadDialog'

interface DiagnosticoData {
  score: number
  status: string
  resumo: string
  riscos: string[]
  recomendacoes: string[]
}

const statusConfig: Record<StatusApolice, { label: string; color: 'error' | 'warning' | 'success' | 'default'; icon: React.ElementType }> = {
  VENCIDA: { label: 'Apólice Vencida', color: 'error', icon: ErrorIcon },
  VENCENDO: { label: 'Apólice Vencendo', color: 'warning', icon: WarningAmberIcon },
  VIGENTE: { label: 'Apólice Vigente', color: 'success', icon: CheckCircleIcon },
  SEM_APOLICE: { label: 'Sem Apólice', color: 'default', icon: HelpOutlineIcon },
}

const amenidadesConfig = [
  { key: 'temPortaria24h', label: 'Portaria 24h', icon: MeetingRoomIcon },
  { key: 'temPiscina', label: 'Piscina', icon: PoolIcon },
  { key: 'temAcademia', label: 'Academia', icon: FitnessCenterIcon },
  { key: 'temSalaoFestas', label: 'Salão de Festas', icon: CelebrationIcon },
  { key: 'temPlayground', label: 'Playground', icon: ChildCareIcon },
  { key: 'temChurrasqueira', label: 'Churrasqueira', icon: OutdoorGrillIcon },
  { key: 'temQuadra', label: 'Quadra', icon: SportsTennisIcon },
  { key: 'temPlacasSolares', label: 'Placas Solares', icon: SolarPowerIcon },
]

const tipoConstrucaoLabels: Record<string, string> = {
  RESIDENCIAL: 'Residencial',
  COMERCIAL: 'Comercial',
  MISTO: 'Misto',
}

function calculateCompleteness(c: CondominioResponse): { percent: number; missing: string[] } {
  const fields: { check: boolean; label: string }[] = [
    { check: !!c.nome, label: 'Nome' },
    { check: !!c.cnpj, label: 'CNPJ' },
    { check: !!c.endereco.endereco, label: 'Endereco' },
    { check: !!c.endereco.cidade, label: 'Cidade' },
    { check: !!c.endereco.estado, label: 'Estado' },
    { check: !!c.endereco.cep, label: 'CEP' },
    { check: !!c.caracteristicas.numeroUnidades, label: 'Numero de Unidades' },
    { check: !!c.caracteristicas.numeroBlocos, label: 'Numero de Blocos' },
    { check: !!c.caracteristicas.numeroAndares, label: 'Numero de Andares' },
    { check: !!c.caracteristicas.areaConstruida, label: 'Area Construida' },
    { check: !!c.caracteristicas.anoConstrucao, label: 'Ano de Construção' },
    { check: !!c.caracteristicas.tipoConstrucao, label: 'Tipo de Construção' },
    { check: !!c.sindico.sindicoNome, label: 'Síndico' },
    { check: !!c.seguro.seguradoraAtual, label: 'Seguradora' },
    { check: !!c.seguro.vencimentoApolice, label: 'Vencimento Apólice' },
  ]
  const filled = fields.filter(f => f.check).length
  const missing = fields.filter(f => !f.check).map(f => f.label)
  return { percent: Math.round((filled / fields.length) * 100), missing }
}

function buildMapUrl(c: CondominioResponse): string {
  const parts = [
    c.endereco.endereco,
    c.endereco.numero,
    c.endereco.bairro,
    c.endereco.cidade,
    c.endereco.estado,
    'Brasil',
  ].filter(Boolean).join(', ')
  const q = encodeURIComponent(parts)
  return `https://www.openstreetmap.org/export/embed.html?bbox=&layer=mapnik&marker=&query=${q}`
}

export default function CondominioDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { confirm: confirmDialog } = useConfirmDialog()
  const id = params.id as string

  // Core state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [condominio, setCondominio] = useState<CondominioResponse | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  // Diagnostico
  const [diagnostico, setDiagnostico] = useState<DiagnosticoData | null>(null)
  const [diagnosticoLoading, setDiagnosticoLoading] = useState(false)

  // Documents
  const [documentos, setDocumentos] = useState<DocumentoListResponse[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  // Related data
  const [vistorias, setVistorias] = useState<VistoriaListResponse[]>([])
  const [vistoriasLoading, setVistoriasLoading] = useState(false)
  const [sinistros, setSinistros] = useState<SinistroListResponse[]>([])
  const [sinistrosLoading, setSinistrosLoading] = useState(false)
  const [apolices, setApolices] = useState<ApoliceListResponse[]>([])
  const [apoliceVigente, setApoliceVigente] = useState<ApoliceResponse | null>(null)
  const [apolicesLoading, setApolicesLoading] = useState(false)

  const canEdit = user?.role === 'ADMIN' || user?.role === 'CORRETORA' || user?.role === 'ADMINISTRADORA'
  const canDelete = user?.role === 'ADMIN' || user?.role === 'CORRETORA'

  const loadDocumentos = useCallback(async () => {
    try {
      setDocsLoading(true)
      const docs = await documentoService.listByCondominio(id)
      setDocumentos(docs)
    } catch (err) {
      console.error('Error loading documentos:', err)
    } finally {
      setDocsLoading(false)
    }
  }, [id])

  const loadVistorias = useCallback(async () => {
    try {
      setVistoriasLoading(true)
      const data = await vistoriaService.listByCondominio(id)
      setVistorias(data)
    } catch (err) {
      console.error('Error loading vistorias:', err)
    } finally {
      setVistoriasLoading(false)
    }
  }, [id])

  const loadSinistros = useCallback(async () => {
    try {
      setSinistrosLoading(true)
      const data = await sinistroService.listByCondominio(id)
      setSinistros(data)
    } catch (err) {
      console.error('Error loading sinistros:', err)
    } finally {
      setSinistrosLoading(false)
    }
  }, [id])

  const loadApolices = useCallback(async () => {
    try {
      setApolicesLoading(true)
      const data = await apoliceService.getByCondominio(id)
      setApolices(data)
      try {
        const vigente = await apoliceService.getVigenteByCondominio(id)
        setApoliceVigente(vigente)
      } catch {
        // No vigente apolice - that's ok
      }
    } catch (err) {
      console.error('Error loading apolices:', err)
    } finally {
      setApolicesLoading(false)
    }
  }, [id])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await condominioService.getById(id)
        setCondominio(data)
      } catch (err) {
        console.error('Error fetching condominio:', err)
        setError('Erro ao carregar dados do condominio.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    loadDocumentos()
    loadVistorias()
    loadSinistros()
    loadApolices()
  }, [id, loadDocumentos, loadVistorias, loadSinistros, loadApolices])

  // Fetch diagnostic after condominio loads
  useEffect(() => {
    if (!condominio) return
    async function fetchDiagnostico() {
      try {
        setDiagnosticoLoading(true)
        const result = await iaService.analyzeDiagnostico({ condominio_id: id, coberturas: [] })
        setDiagnostico({
          score: result.score,
          status: result.status,
          resumo: `Score de cobertura: ${result.score}. ${result.coberturas_adequadas.length} coberturas adequadas, ${result.coberturas_insuficientes.length} insuficientes, ${result.coberturas_ausentes.length} ausentes.`,
          riscos: result.riscos_identificados.map((r) => r.risco),
          recomendacoes: result.recomendacoes.map((r) => r.descricao),
        })
      } catch (err) {
        console.error('IA Service not available:', err)
      } finally {
        setDiagnosticoLoading(false)
      }
    }
    fetchDiagnostico()
  }, [id, condominio])

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este condominio?',
      severity: 'error',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    })
    if (ok) {
      try {
        await condominioService.delete(id)
        router.push('/dashboard/condominios')
      } catch (err) {
        console.error('Error deleting condominio:', err)
        setError('Erro ao excluir condominio.')
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    setUploadDialogOpen(true)
  }

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false)
    setSnackbar({ open: true, message: 'Documentos enviados com sucesso!', severity: 'success' })
    loadDocumentos()
  }

  // Auto-refresh when there are PROCESSANDO documents
  const hasProcessing = documentos.some(d => d.status === 'PROCESSANDO')
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (hasProcessing) {
      refreshIntervalRef.current = setInterval(() => {
        loadDocumentos()
      }, 8000)
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
    }
  }, [hasProcessing, loadDocumentos])

  const handleDownload = async (docId: string, nomeArquivo: string) => {
    try {
      const blob = await documentoService.download(docId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nomeArquivo
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading:', err)
      setSnackbar({ open: true, message: 'Erro ao baixar documento', severity: 'error' })
    }
  }

  const getStatusFromDias = (dias?: number): StatusApolice => {
    if (dias === undefined || dias === null) return 'SEM_APOLICE'
    if (dias < 0) return 'VENCIDA'
    if (dias <= 30) return 'VENCENDO'
    return 'VIGENTE'
  }

  // Computed values
  const completeness = useMemo(() => condominio ? calculateCompleteness(condominio) : null, [condominio])
  const completenessColor = completeness ? (completeness.percent >= 80 ? '#22c55e' : completeness.percent >= 50 ? '#f59e0b' : '#ef4444') : '#e2e8f0'

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!condominio) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Condomínio não encontrado.</Typography>
      </Box>
    )
  }

  const statusApolice = getStatusFromDias(condominio.seguro.diasParaVencimento)
  const status = statusConfig[statusApolice]
  const StatusIcon = status.icon

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/dashboard/condominios')}
            sx={{ mb: 1 }}
          >
            Voltar
          </Button>
          <Typography variant="h4" fontWeight="bold">
            {condominio.nome}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            {condominio.cnpj && (
              <Typography variant="body2" color="text.secondary">
                CNPJ: {condominio.cnpj}
              </Typography>
            )}
            {condominio.caracteristicas.tipoConstrucao && (
              <Chip
                label={tipoConstrucaoLabels[condominio.caracteristicas.tipoConstrucao]}
                size="small"
                variant="outlined"
              />
            )}
            <Chip
              icon={<StatusIcon style={{ fontSize: 16 }} />}
              label={status.label}
              size="small"
              color={status.color}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<HelpOutlineIcon />}
            onClick={() => router.push(`/dashboard/assistente?context=condominio&from=${condominio.nome}`)}
            sx={{ borderColor: '#6366f1', color: '#6366f1' }}
          >
            Ajuda da IA
          </Button>
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/dashboard/condominios/${id}/editar`)}
            >
              Editar
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Excluir
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HomeWorkIcon sx={{ color: '#6366f1' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="bold">{condominio.caracteristicas.numeroUnidades || '—'}</Typography>
              <Typography variant="caption" color="text.secondary">Unidades</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: statusApolice === 'VIGENTE' ? '#dcfce7' : statusApolice === 'VENCENDO' ? '#fef3c7' : statusApolice === 'VENCIDA' ? '#fecaca' : '#f1f5f9',
            }}>
              <GppGoodIcon sx={{
                color: statusApolice === 'VIGENTE' ? '#22c55e' : statusApolice === 'VENCENDO' ? '#f59e0b' : statusApolice === 'VENCIDA' ? '#ef4444' : '#94a3b8',
              }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {condominio.seguro.diasParaVencimento !== undefined && condominio.seguro.diasParaVencimento !== null
                  ? (condominio.seguro.diasParaVencimento < 0
                    ? `${Math.abs(condominio.seguro.diasParaVencimento)}d`
                    : `${condominio.seguro.diasParaVencimento}d`)
                  : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {condominio.seguro.diasParaVencimento !== undefined && condominio.seguro.diasParaVencimento < 0
                  ? 'Vencida ha' : 'Vence em'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AssignmentIcon sx={{ color: '#3b82f6' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="bold">{vistorias.length}</Typography>
              <Typography variant="caption" color="text.secondary">Vistorias</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReportProblemIcon sx={{ color: '#f59e0b' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="bold">{sinistros.length}</Typography>
              <Typography variant="caption" color="text.secondary">Sinistros</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Profile Completeness */}
      {completeness && completeness.percent < 100 && (
        <Paper sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight="600">
              Cadastro {completeness.percent}% completo
            </Typography>
            {canEdit && (
              <Button
                size="small"
                onClick={() => router.push(`/dashboard/condominios/${id}/editar`)}
                sx={{ color: '#6366f1', fontSize: '0.75rem' }}
              >
                Completar Cadastro
              </Button>
            )}
          </Box>
          <LinearProgress
            variant="determinate"
            value={completeness.percent}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: '#f1f5f9',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: completenessColor,
              },
            }}
          />
          {completeness.missing.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Falta: {completeness.missing.slice(0, 4).join(', ')}{completeness.missing.length > 4 ? ` e mais ${completeness.missing.length - 4}` : ''}
            </Typography>
          )}
        </Paper>
      )}

      {/* Quick Actions */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<CalendarTodayIcon />}
          onClick={() => router.push(`/dashboard/vistorias?condominioId=${id}&action=new`)}
          sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
        >
          Agendar Vistoria
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ReportProblemIcon />}
          onClick={() => router.push(`/dashboard/sinistros?condominioId=${id}&action=new`)}
          sx={{ borderColor: '#f59e0b', color: '#f59e0b' }}
        >
          Registrar Sinistro
        </Button>
        {documentos.filter(d => d.tipo === 'ORCAMENTO').length >= 2 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<CompareArrowsIcon />}
            onClick={() => router.push(`/dashboard/comparar-orcamentos?condominioId=${id}`)}
            sx={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}
          >
            Comparar Orcamentos
          </Button>
        )}
        {apoliceVigente && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<SecurityIcon />}
            onClick={() => router.push(`/dashboard/seguros/apolices/${apoliceVigente.id}`)}
            sx={{ borderColor: '#22c55e', color: '#22c55e' }}
          >
            Ver Apolice
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            px: 2,
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 },
            '& .Mui-selected': { color: '#6366f1' },
            '& .MuiTabs-indicator': { bgcolor: '#6366f1' },
          }}
        >
          <Tab label="Geral" />
          <Tab label="Seguro & Diagnostico" />
          <Tab label={`Documentos (${documentos.length})`} />
          <Tab label={`Vistorias & Sinistros (${vistorias.length + sinistros.length})`} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* === TAB 0: GERAL === */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Endereco + Mapa */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationOnIcon color="primary" />
                  <Typography variant="h6" fontWeight="600">Endereco</Typography>
                </Box>
                <Typography>
                  {condominio.endereco.endereco}
                  {condominio.endereco.numero && `, ${condominio.endereco.numero}`}
                  {condominio.endereco.complemento && ` - ${condominio.endereco.complemento}`}
                </Typography>
                <Typography color="text.secondary">
                  {condominio.endereco.bairro && `${condominio.endereco.bairro}, `}
                  {condominio.endereco.cidade && `${condominio.endereco.cidade}`}
                  {condominio.endereco.estado && ` - ${condominio.endereco.estado}`}
                </Typography>
                {condominio.endereco.cep && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    CEP: {condominio.endereco.cep}
                  </Typography>
                )}
                {/* Mini Map */}
                {condominio.endereco.cidade && (
                  <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', height: 180 }}>
                    <iframe
                      width="100%"
                      height="180"
                      frameBorder="0"
                      scrolling="no"
                      src={buildMapUrl(condominio)}
                      style={{ border: 0 }}
                      title="Localizacao do condominio"
                    />
                  </Box>
                )}
              </Grid>

              {/* Caracteristicas */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ApartmentIcon color="primary" />
                  <Typography variant="h6" fontWeight="600">Caracteristicas</Typography>
                </Box>
                <Grid container spacing={2}>
                  {condominio.caracteristicas.numeroUnidades && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Unidades</Typography>
                      <Typography fontWeight="500">{condominio.caracteristicas.numeroUnidades}</Typography>
                    </Grid>
                  )}
                  {condominio.caracteristicas.numeroBlocos && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Blocos</Typography>
                      <Typography fontWeight="500">{condominio.caracteristicas.numeroBlocos}</Typography>
                    </Grid>
                  )}
                  {condominio.caracteristicas.numeroAndares && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Andares</Typography>
                      <Typography fontWeight="500">{condominio.caracteristicas.numeroAndares}</Typography>
                    </Grid>
                  )}
                  {condominio.caracteristicas.numeroElevadores && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Elevadores</Typography>
                      <Typography fontWeight="500">{condominio.caracteristicas.numeroElevadores}</Typography>
                    </Grid>
                  )}
                  {condominio.caracteristicas.areaConstruida && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Area Construida</Typography>
                      <Typography fontWeight="500">{condominio.caracteristicas.areaConstruida} m2</Typography>
                    </Grid>
                  )}
                  {condominio.caracteristicas.areaTotal && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Area Total</Typography>
                      <Typography fontWeight="500">{condominio.caracteristicas.areaTotal} m2</Typography>
                    </Grid>
                  )}
                  {condominio.caracteristicas.anoConstrucao && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Ano Construcao</Typography>
                      <Typography fontWeight="500">{condominio.caracteristicas.anoConstrucao}</Typography>
                    </Grid>
                  )}
                  {condominio.caracteristicas.numeroFuncionarios && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Funcionarios</Typography>
                      <Typography fontWeight="500">{condominio.caracteristicas.numeroFuncionarios}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {/* Sindico */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6" fontWeight="600">Síndico</Typography>
                </Box>
                {condominio.sindico.sindicoNome ? (
                  <>
                    <Typography fontWeight="500">{condominio.sindico.sindicoNome}</Typography>
                    {condominio.sindico.sindicoEmail && (
                      <Typography variant="body2" color="text.secondary">{condominio.sindico.sindicoEmail}</Typography>
                    )}
                    {condominio.sindico.sindicoTelefone && (
                      <Typography variant="body2" color="text.secondary">{condominio.sindico.sindicoTelefone}</Typography>
                    )}
                  </>
                ) : (
                  <Typography color="text.secondary">Nao informado</Typography>
                )}
              </Grid>

              {/* Amenidades */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Amenidades</Typography>
                <Grid container spacing={1}>
                  {amenidadesConfig.map((amenidade) => {
                    const hasAmenidade = condominio.amenidades[amenidade.key as keyof typeof condominio.amenidades]
                    const AmenidadeIcon = amenidade.icon
                    return (
                      <Grid item xs={6} key={amenidade.key}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            borderRadius: 1,
                            bgcolor: hasAmenidade ? '#f0fdf4' : '#fafafa',
                            border: `1px solid ${hasAmenidade ? '#bbf7d0' : '#f1f5f9'}`,
                          }}
                        >
                          <AmenidadeIcon sx={{ color: hasAmenidade ? '#22c55e' : '#d1d5db', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: hasAmenidade ? '#166534' : '#9ca3af', flex: 1 }}>
                            {amenidade.label}
                          </Typography>
                          {hasAmenidade ? (
                            <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 16 }} />
                          ) : (
                            <CancelIcon sx={{ color: '#d1d5db', fontSize: 16 }} />
                          )}
                        </Box>
                      </Grid>
                    )
                  })}
                </Grid>
              </Grid>

              {/* Observacoes */}
              {condominio.observacoes && (
                <Grid item xs={12}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>Observações</Typography>
                  <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {condominio.observacoes}
                  </Typography>
                </Grid>
              )}

              {/* Metadata */}
              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                    <Typography variant="caption" color="text.secondary">
                      Criado em {new Date(condominio.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                    <Typography variant="caption" color="text.secondary">
                      Atualizado em {new Date(condominio.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* === TAB 1: SEGURO & DIAGNOSTICO === */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              {/* Seguro Atual */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6" fontWeight="600">Seguro Atual</Typography>
                </Box>
                {condominio.seguro.seguradoraAtual ? (
                  <Box>
                    <Typography fontWeight="500" variant="h6">{condominio.seguro.seguradoraAtual}</Typography>
                    {condominio.seguro.vencimentoApolice && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Vencimento: {new Date(condominio.seguro.vencimentoApolice).toLocaleDateString('pt-BR')}
                      </Typography>
                    )}
                    {condominio.seguro.diasParaVencimento !== undefined && (
                      <Chip
                        icon={<StatusIcon style={{ fontSize: 16 }} />}
                        label={
                          condominio.seguro.diasParaVencimento < 0
                            ? `Vencida ha ${Math.abs(condominio.seguro.diasParaVencimento)} dias`
                            : `${condominio.seguro.diasParaVencimento} dias para vencimento`
                        }
                        size="small"
                        color={status.color}
                        sx={{ mt: 1 }}
                      />
                    )}
                    {/* Apolice vigente details */}
                    {apoliceVigente && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>Detalhes da Apolice</Typography>
                        {apoliceVigente.numeroApolice && (
                          <Typography variant="body2" color="text.secondary">
                            N.: {apoliceVigente.numeroApolice}
                          </Typography>
                        )}
                        {apoliceVigente.premioTotal && (
                          <Typography variant="body2" color="text.secondary">
                            Premio: R$ {apoliceVigente.premioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Typography>
                        )}
                        {apoliceVigente.importanciaSeguradaTotal && (
                          <Typography variant="body2" color="text.secondary">
                            IS Total: R$ {apoliceVigente.importanciaSeguradaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Typography>
                        )}
                        {apoliceVigente.coberturas && apoliceVigente.coberturas.length > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            {apoliceVigente.coberturas.filter(c => c.contratada).length} coberturas contratadas
                          </Typography>
                        )}
                        <Button
                          size="small"
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => router.push(`/dashboard/seguros/apolices/${apoliceVigente.id}`)}
                          sx={{ mt: 1, color: '#6366f1', p: 0 }}
                        >
                          Ver Apólice Completa
                        </Button>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <SecurityIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 1 }} />
                    <Typography color="text.secondary">Nenhum seguro informado</Typography>
                  </Box>
                )}
              </Grid>

              {/* Historico de Apolices */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="h6" fontWeight="600">Histórico de Apólices</Typography>
                    <Chip label={apolices.length} size="small" sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 700, height: 22 }} />
                  </Box>
                </Box>
                {apolicesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
                ) : apolices.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <DescriptionIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 1 }} />
                    <Typography color="text.secondary">Nenhuma apolice vinculada</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {apolices.map((ap) => (
                      <Box
                        key={ap.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#f8fafc' },
                        }}
                        onClick={() => router.push(`/dashboard/seguros/apolices/${ap.id}`)}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="500">
                            {ap.seguradoraNome || 'Seguradora nao informada'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ap.numeroApolice && `N. ${ap.numeroApolice} • `}
                            {ap.premioTotal && `R$ ${ap.premioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </Typography>
                        </Box>
                        <Chip
                          label={getStatusApoliceLabel(ap.status)}
                          size="small"
                          color={getStatusApoliceColor(ap.status)}
                          sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>

              {/* Diagnostico IA */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)',
                    border: '1px solid #e2e8f0',
                    boxShadow: 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SmartToyIcon sx={{ color: '#6366f1' }} />
                      <Typography variant="h6" fontWeight="600">Diagnóstico de Cobertura</Typography>
                      <Chip label="IA" size="small" sx={{ bgcolor: '#6366f1', color: 'white', height: 20, fontSize: '0.7rem' }} />
                    </Box>
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/dashboard/diagnostico')}
                      sx={{ color: '#6366f1' }}
                    >
                      Ver Completo
                    </Button>
                  </Box>

                  {diagnosticoLoading ? (
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      <Skeleton variant="circular" width={80} height={80} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" height={24} />
                        <Skeleton variant="text" width="80%" height={20} />
                      </Box>
                    </Box>
                  ) : diagnostico ? (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              position: 'relative', width: 80, height: 80, borderRadius: '50%',
                              background: `conic-gradient(${diagnostico.score >= 80 ? '#22c55e' : diagnostico.score >= 60 ? '#f59e0b' : '#ef4444'} ${diagnostico.score * 3.6}deg, #e2e8f0 ${diagnostico.score * 3.6}deg)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="h5" fontWeight="bold">{diagnostico.score}</Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Chip
                              label={diagnostico.status}
                              size="small"
                              sx={{
                                bgcolor: diagnostico.score >= 80 ? '#dcfce7' : diagnostico.score >= 60 ? '#fef3c7' : '#fecaca',
                                color: diagnostico.score >= 80 ? '#166534' : diagnostico.score >= 60 ? '#92400e' : '#991b1b',
                                fontWeight: 600,
                              }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Score de Cobertura</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={9}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{diagnostico.resumo}</Typography>
                        {diagnostico.recomendacoes.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>Principais Recomendacoes:</Typography>
                            {diagnostico.recomendacoes.slice(0, 2).map((rec, idx) => (
                              <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1, bgcolor: '#eff6ff', borderRadius: 1, borderLeft: '3px solid #3b82f6', mb: 1 }}>
                                <TipsAndUpdatesIcon sx={{ color: '#3b82f6', fontSize: 18, mt: 0.2 }} />
                                <Typography variant="body2" sx={{ color: '#1e40af' }}>{rec}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                        {diagnostico.riscos.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>Riscos Identificados:</Typography>
                            {diagnostico.riscos.slice(0, 2).map((risco, idx) => (
                              <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1, bgcolor: '#fef2f2', borderRadius: 1, borderLeft: '3px solid #ef4444', mb: 1 }}>
                                <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 18, mt: 0.2 }} />
                                <Typography variant="body2" sx={{ color: '#991b1b' }}>{risco}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <SmartToyIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 1 }} />
                      <Typography color="text.secondary">Servico de IA indisponivel</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* === TAB 2: DOCUMENTOS === */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important' }} />}
                    label="Extracao IA"
                    size="small"
                    sx={{
                      bgcolor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
                      fontWeight: 600, fontSize: '0.7rem', height: 24,
                      '& .MuiChip-icon': { color: '#22c55e' },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => setUploadDialogOpen(true)}
                    sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
                  >
                    Upload
                  </Button>
                  {documentos.length > 10 && (
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/dashboard/documentos')}
                      sx={{ color: '#6366f1' }}
                    >
                      Ver Todos
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Drag and Drop */}
              <Box
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => setUploadDialogOpen(true)}
                sx={{
                  p: 3, mb: 2,
                  border: `2px dashed ${dragOver ? '#6366f1' : '#e2e8f0'}`,
                  borderRadius: 2,
                  bgcolor: dragOver ? '#ede9fe' : '#fafafa',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#6366f1', bgcolor: '#f5f3ff' },
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 36, color: dragOver ? '#6366f1' : '#94a3b8', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Arraste arquivos aqui ou clique para selecionar
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 14, color: '#22c55e' }} />
                  <Typography variant="caption" sx={{ color: '#166534' }}>
                    PDFs de orcamentos e apolices sao extraidos automaticamente pela IA
                  </Typography>
                </Box>
              </Box>

              {/* Table */}
              {docsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
              ) : documentos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 1 }} />
                  <Typography color="text.secondary">Nenhum documento vinculado</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Nome</TableCell>
                        <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Tipo</TableCell>
                        <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Tamanho</TableCell>
                        <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Data</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Acoes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {documentos.map((doc) => (
                        <TableRow
                          key={doc.id}
                          hover
                          sx={{
                            '&:last-child td': { border: 0 },
                            ...(doc.status === 'PROCESSANDO' && {
                              bgcolor: '#eff6ff',
                              animation: 'processingPulse 2s ease-in-out infinite',
                              '@keyframes processingPulse': {
                                '0%, 100%': { bgcolor: '#eff6ff' },
                                '50%': { bgcolor: '#dbeafe' },
                              },
                            }),
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DescriptionIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                              <Typography variant="body2" fontWeight={500} sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {doc.nome}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={getTipoDocumentoLabel(doc.tipo)} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={doc.status === 'PROCESSANDO' ? <SyncIcon sx={{ fontSize: '14px !important', animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} /> : undefined}
                              label={getStatusLabel(doc.status)}
                              size="small"
                              color={getStatusColor(doc.status)}
                              sx={{ fontSize: '0.7rem', height: 22 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{formatFileSize(doc.tamanhoBytes)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Visualizar">
                              <IconButton size="small" onClick={() => router.push(`/dashboard/documentos?id=${doc.id}`)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton size="small" onClick={() => handleDownload(doc.id, doc.nomeArquivo)}>
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* === TAB 3: VISTORIAS & SINISTROS === */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              {/* Vistorias */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon sx={{ color: '#3b82f6' }} />
                    <Typography variant="h6" fontWeight="600">Vistorias</Typography>
                    <Chip label={vistorias.length} size="small" sx={{ bgcolor: '#dbeafe', color: '#3b82f6', fontWeight: 700, height: 22 }} />
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => router.push(`/dashboard/vistorias?condominioId=${id}&action=new`)}
                    sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                  >
                    Agendar Vistoria
                  </Button>
                </Box>
                {vistoriasLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
                ) : vistorias.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AssignmentIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 1 }} />
                    <Typography color="text.secondary">Nenhuma vistoria registrada</Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => router.push(`/dashboard/vistorias?condominioId=${id}&action=new`)}
                      sx={{ mt: 1, color: '#3b82f6' }}
                    >
                      Agendar primeira vistoria
                    </Button>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Tipo</TableCell>
                          <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Data Agendada</TableCell>
                          <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Responsável</TableCell>
                          <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Nota</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Acoes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {vistorias.slice(0, 10).map((v) => (
                          <TableRow key={v.id} hover sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }} onClick={() => router.push(`/dashboard/vistorias/${v.id}`)}>
                            <TableCell>
                              <Chip label={getTipoVistoriaLabel(v.tipo)} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                            </TableCell>
                            <TableCell>
                              <Chip label={getStatusVistoriaLabel(v.status)} size="small" color={getStatusVistoriaColor(v.status)} sx={{ fontSize: '0.7rem', height: 22 }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{new Date(v.dataAgendada).toLocaleDateString('pt-BR')}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">{v.responsavelNome || '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              {v.notaGeral !== undefined && v.notaGeral !== null ? (
                                <Chip
                                  label={`${v.notaGeral}/10`}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem', height: 22, fontWeight: 700,
                                    bgcolor: v.notaGeral >= 8 ? '#dcfce7' : v.notaGeral >= 6 ? '#fef3c7' : '#fecaca',
                                    color: v.notaGeral >= 8 ? '#166534' : v.notaGeral >= 6 ? '#92400e' : '#991b1b',
                                  }}
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">—</Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Ver detalhes">
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/vistorias/${v.id}`) }}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {vistorias.length > 10 && (
                  <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push(`/dashboard/vistorias?condominioId=${id}`)} sx={{ color: '#3b82f6' }}>
                      Ver todas as {vistorias.length} vistorias
                    </Button>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Sinistros */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReportProblemIcon sx={{ color: '#f59e0b' }} />
                    <Typography variant="h6" fontWeight="600">Sinistros</Typography>
                    <Chip label={sinistros.length} size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, height: 22 }} />
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => router.push(`/dashboard/sinistros?condominioId=${id}&action=new`)}
                    sx={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                  >
                    Registrar Sinistro
                  </Button>
                </Box>
                {sinistrosLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
                ) : sinistros.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: '#22c55e', mb: 1 }} />
                    <Typography color="text.secondary">Nenhum sinistro registrado</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Tipo</TableCell>
                          <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Data</TableCell>
                          <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Descricao</TableCell>
                          <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Valor Prejuizo</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>Acoes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sinistros.slice(0, 10).map((s) => (
                          <TableRow key={s.id} hover sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }} onClick={() => router.push(`/dashboard/sinistros/${s.id}`)}>
                            <TableCell>
                              <Chip label={getTipoSinistroLabel(s.tipo)} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                            </TableCell>
                            <TableCell>
                              <Chip label={getStatusSinistroLabel(s.status)} size="small" color={getStatusSinistroColor(s.status)} sx={{ fontSize: '0.7rem', height: 22 }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{new Date(s.dataOcorrencia).toLocaleDateString('pt-BR')}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.descricao}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {s.valorPrejuizo ? (
                                <Typography variant="body2" fontWeight="500">
                                  R$ {s.valorPrejuizo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">—</Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Ver detalhes">
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/sinistros/${s.id}`) }}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {sinistros.length > 10 && (
                  <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push(`/dashboard/sinistros?condominioId=${id}`)} sx={{ color: '#f59e0b' }}>
                      Ver todos os {sinistros.length} sinistros
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Upload Dialog */}
      <DocumentoUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
        condominioId={id}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
