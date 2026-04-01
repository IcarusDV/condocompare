'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
  Tab,
  Tabs,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import TimelineIcon from '@mui/icons-material/Timeline'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import PaidIcon from '@mui/icons-material/Paid'
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import BusinessIcon from '@mui/icons-material/Business'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import SendIcon from '@mui/icons-material/Send'
import PersonIcon from '@mui/icons-material/Person'
import PhoneIcon from '@mui/icons-material/Phone'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import ChatIcon from '@mui/icons-material/Chat'
import FolderIcon from '@mui/icons-material/Folder'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext'
import {
  sinistroService,
  getTipoSinistroLabel,
  getStatusSinistroLabel,
} from '@/services/sinistroService'
import { iaService } from '@/services/iaService'
import {
  SinistroResponse,
  UpdateSinistroRequest,
  TipoSinistro,
  StatusSinistro,
} from '@/types'

const statusConfig: Record<string, { color: string; bg: string }> = {
  ABERTO: { color: '#f59e0b', bg: '#fef3c7' },
  EM_ANALISE: { color: '#3b82f6', bg: '#dbeafe' },
  APROVADO: { color: '#22c55e', bg: '#dcfce7' },
  NEGADO: { color: '#ef4444', bg: '#fee2e2' },
  PAGO: { color: '#10b981', bg: '#d1fae5' },
  CANCELADO: { color: '#94a3b8', bg: '#f1f5f9' },
}

const statusFlowConfig: Record<string, { next: StatusSinistro; label: string; icon: React.ReactNode; color: string }[]> = {
  ABERTO: [
    { next: 'EM_ANALISE', label: 'Iniciar Análise', icon: <PlayArrowIcon />, color: '#3b82f6' },
    { next: 'CANCELADO', label: 'Cancelar', icon: <CancelIcon />, color: '#94a3b8' },
  ],
  EM_ANALISE: [
    { next: 'APROVADO', label: 'Aprovar', icon: <CheckCircleIcon />, color: '#22c55e' },
    { next: 'NEGADO', label: 'Negar', icon: <DoNotDisturbIcon />, color: '#ef4444' },
    { next: 'CANCELADO', label: 'Cancelar', icon: <CancelIcon />, color: '#94a3b8' },
  ],
  APROVADO: [
    { next: 'PAGO', label: 'Registrar Pagamento', icon: <PaidIcon />, color: '#10b981' },
    { next: 'CANCELADO', label: 'Cancelar', icon: <CancelIcon />, color: '#94a3b8' },
  ],
}

export default function SinistroDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { confirm: confirmDialog } = useConfirmDialog()
  const sinistroId = params.id as string
  const canEdit = user?.role === 'CORRETORA' || user?.role === 'ADMIN'

  const [sinistro, setSinistro] = useState<SinistroResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState<UpdateSinistroRequest>({})
  const [saving, setSaving] = useState(false)

  // Historico
  const [historicoText, setHistoricoText] = useState('')
  const [addingHistorico, setAddingHistorico] = useState(false)

  // Status change
  const [statusChanging, setStatusChanging] = useState(false)

  // Payment dialog
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentValue, setPaymentValue] = useState<number | ''>('')

  // Tabs
  const [activeTab, setActiveTab] = useState(0)

  // IA Communication draft
  const [iaDraftLoading, setIaDraftLoading] = useState(false)
  const [iaDraft, setIaDraft] = useState<string | null>(null)

  // Communication log
  const [commText, setCommText] = useState('')
  const [addingComm, setAddingComm] = useState(false)

  const loadSinistro = async () => {
    try {
      setLoading(true)
      const data = await sinistroService.getById(sinistroId)
      setSinistro(data)
    } catch (err) {
      console.error('Error loading sinistro:', err)
      setError('Erro ao carregar sinistro')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sinistroId) loadSinistro()
  }, [sinistroId])

  const handleStatusChange = async (newStatus: StatusSinistro) => {
    if (newStatus === 'PAGO') {
      setPaymentValue(sinistro?.valorPrejuizo || '')
      setPaymentOpen(true)
      return
    }
    try {
      setStatusChanging(true)
      await sinistroService.update(sinistroId, { status: newStatus })
      setSuccess(`Status alterado para ${getStatusSinistroLabel(newStatus)}`)
      loadSinistro()
    } catch (err) {
      console.error('Error changing status:', err)
      setError('Erro ao alterar status')
    } finally {
      setStatusChanging(false)
    }
  }

  const handlePaymentConfirm = async () => {
    try {
      setStatusChanging(true)
      await sinistroService.update(sinistroId, {
        status: 'PAGO',
        valorIndenizado: paymentValue ? Number(paymentValue) : undefined,
      })
      setPaymentOpen(false)
      setSuccess('Pagamento registrado com sucesso')
      loadSinistro()
    } catch (err) {
      console.error('Error registering payment:', err)
      setError('Erro ao registrar pagamento')
    } finally {
      setStatusChanging(false)
    }
  }

  const handleOpenEdit = () => {
    if (!sinistro) return
    setEditData({
      numeroSinistro: sinistro.numeroSinistro || '',
      tipo: sinistro.tipo,
      dataOcorrencia: sinistro.dataOcorrencia,
      dataComunicacao: sinistro.dataComunicacao || '',
      descricao: sinistro.descricao,
      localOcorrencia: sinistro.localOcorrencia || '',
      valorPrejuizo: sinistro.valorPrejuizo,
      valorFranquia: sinistro.valorFranquia,
      valorIndenizado: sinistro.valorIndenizado,
      coberturaAcionada: sinistro.coberturaAcionada || '',
      seguradoraProtocolo: sinistro.seguradoraProtocolo || '',
      seguradoraContato: sinistro.seguradoraContato || '',
      observacoes: sinistro.observacoes || '',
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    try {
      setSaving(true)
      await sinistroService.update(sinistroId, editData)
      setEditOpen(false)
      setSuccess('Sinistro atualizado com sucesso')
      loadSinistro()
    } catch (err) {
      console.error('Error updating:', err)
      setError('Erro ao atualizar sinistro')
    } finally {
      setSaving(false)
    }
  }

  const handleAddHistorico = async () => {
    if (!historicoText.trim()) return
    try {
      setAddingHistorico(true)
      await sinistroService.addHistorico(sinistroId, historicoText.trim())
      setHistoricoText('')
      setSuccess('Histórico adicionado')
      loadSinistro()
    } catch (err) {
      console.error('Error adding historico:', err)
      setError('Erro ao adicionar histórico')
    } finally {
      setAddingHistorico(false)
    }
  }

  const handleAddCommunication = async () => {
    if (!commText.trim()) return
    try {
      setAddingComm(true)
      await sinistroService.addHistorico(sinistroId, `[COMUNICACAO] ${commText.trim()}`)
      setCommText('')
      setSuccess('Comunicação registrada')
      loadSinistro()
    } catch (err) {
      console.error('Error adding communication:', err)
      setError('Erro ao registrar comunicação')
    } finally {
      setAddingComm(false)
    }
  }

  const handleGenerateIaDraft = async () => {
    if (!sinistro) return
    try {
      setIaDraftLoading(true)
      const result = await iaService.chat({
        message: `Gere um rascunho de comunicação formal para a seguradora sobre o sinistro do tipo "${getTipoSinistroLabel(sinistro.tipo)}" ocorrido em ${formatDate(sinistro.dataOcorrencia)} no condomínio "${sinistro.condominioNome}". Descrição: "${sinistro.descricao}". Status atual: ${getStatusSinistroLabel(sinistro.status)}. ${sinistro.seguradoraProtocolo ? `Protocolo: ${sinistro.seguradoraProtocolo}.` : ''} A comunicação deve ser profissional, objetiva e solicitar atualização do status.`,
        history: [],
        context_type: 'sinistro',
      })
      if (result.response) {
        setIaDraft(result.response)
      }
    } catch (err) {
      console.error('Error generating IA draft:', err)
      setError('Erro ao gerar rascunho com IA')
    } finally {
      setIaDraftLoading(false)
    }
  }

  const handleCopyDraft = () => {
    if (iaDraft) {
      navigator.clipboard.writeText(iaDraft)
      setSuccess('Rascunho copiado para a área de transferência')
    }
  }

  const handleUseDraftAsComm = () => {
    if (iaDraft) {
      setCommText(iaDraft)
      setIaDraft(null)
      setActiveTab(1)
    }
  }

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este sinistro?',
      severity: 'error',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    })
    if (!ok) return
    try {
      await sinistroService.delete(sinistroId)
      router.push('/dashboard/sinistros')
    } catch (err) {
      console.error('Error deleting:', err)
      setError('Erro ao excluir sinistro')
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('pt-BR')
  }

  const formatCurrency = (value?: number) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const getDiasAberto = (): number => {
    if (!sinistro) return 0
    const diff = Date.now() - new Date(sinistro.dataOcorrencia).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!sinistro) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard/sinistros')} sx={{ mb: 2 }}>Voltar</Button>
        <Alert severity="error">Sinistro não encontrado</Alert>
      </Box>
    )
  }

  const sc = statusConfig[sinistro.status] || statusConfig.CANCELADO
  const isOpen = sinistro.status === 'ABERTO' || sinistro.status === 'EM_ANALISE'
  const dias = getDiasAberto()
  const flowActions = statusFlowConfig[sinistro.status] || []

  // Separate historico entries: regular vs communication
  const allHistorico = sinistro.historico || []
  const communications = allHistorico.filter(e => String(e.descricao).startsWith('[COMUNICACAO]'))
  const regularHistorico = allHistorico.filter(e => !String(e.descricao).startsWith('[COMUNICACAO]'))

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard/sinistros')} sx={{ border: '1px solid #e2e8f0' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5" fontWeight="bold">
              Sinistro {sinistro.numeroSinistro ? `#${sinistro.numeroSinistro}` : ''}
            </Typography>
            <Chip
              label={getStatusSinistroLabel(sinistro.status)}
              sx={{
                bgcolor: sc.bg,
                color: sc.color,
                fontWeight: 700,
                fontSize: '0.8rem',
                height: 28,
                textDecoration: sinistro.status === 'NEGADO' ? 'line-through' : 'none',
              }}
            />
            {isOpen && (
              <Chip
                icon={dias > 90 ? <LocalFireDepartmentIcon sx={{ fontSize: 14 }} /> : undefined}
                label={`${dias} dias`}
                size="small"
                sx={{
                  bgcolor: dias > 90 ? '#fee2e2' : dias > 60 ? '#fef3c7' : dias > 30 ? '#dbeafe' : '#f1f5f9',
                  color: dias > 90 ? '#ef4444' : dias > 60 ? '#f59e0b' : dias > 30 ? '#3b82f6' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: dias > 90 ? '1px solid #fecaca' : 'none',
                }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {sinistro.condominioNome} - {getTipoSinistroLabel(sinistro.tipo)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canEdit && (
            <>
              <Button variant="outlined" startIcon={<EditIcon />} onClick={handleOpenEdit} size="small">
                Editar
              </Button>
              <IconButton color="error" onClick={handleDelete} size="small" sx={{ border: '1px solid #fee2e2' }}>
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Info Card */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Informações do Sinistro
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InfoRow icon={<BusinessIcon sx={{ color: '#6366f1' }} />} label="Condomínio" value={sinistro.condominioNome} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow icon={<ReportProblemIcon sx={{ color: '#f59e0b' }} />} label="Tipo" value={getTipoSinistroLabel(sinistro.tipo)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow icon={<CalendarTodayIcon sx={{ color: '#3b82f6' }} />} label="Data da Ocorrência" value={formatDateTime(sinistro.dataOcorrencia)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow icon={<CalendarTodayIcon sx={{ color: '#10b981' }} />} label="Data da Comunicação" value={formatDate(sinistro.dataComunicacao)} />
              </Grid>
              {sinistro.localOcorrencia && (
                <Grid item xs={12} md={6}>
                  <InfoRow icon={<LocationOnIcon sx={{ color: '#ef4444' }} />} label="Local" value={sinistro.localOcorrencia} />
                </Grid>
              )}
              {sinistro.coberturaAcionada && (
                <Grid item xs={12} md={6}>
                  <InfoRow icon={<ReceiptLongIcon sx={{ color: '#8b5cf6' }} />} label="Cobertura Acionada" value={sinistro.coberturaAcionada} />
                </Grid>
              )}
              {sinistro.numeroSinistro && (
                <Grid item xs={12} md={6}>
                  <InfoRow icon={<ReceiptLongIcon sx={{ color: '#6366f1' }} />} label="Número do Sinistro" value={sinistro.numeroSinistro} mono />
                </Grid>
              )}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Descrição
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#334155' }}>
                  {sinistro.descricao}
                </Typography>
              </Grid>
              {sinistro.observacoes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Observações
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', color: '#64748b' }}>
                    {sinistro.observacoes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Financial Card */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Resumo de Sinistros</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', boxShadow: 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>PREJUÍZO</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#ef4444' }}>{formatCurrency(sinistro.valorPrejuizo)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', boxShadow: 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AttachMoneyIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>FRANQUIA</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#f59e0b' }}>{formatCurrency(sinistro.valorFranquia)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AttachMoneyIcon sx={{ color: '#22c55e', fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>INDENIZADO</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#22c55e' }}>{formatCurrency(sinistro.valorIndenizado)}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* Protocolo Seguradora */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Protocolo da Seguradora</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InfoRow icon={<ReceiptLongIcon sx={{ color: '#6366f1' }} />} label="Número do Protocolo" value={sinistro.seguradoraProtocolo || 'Não informado'} mono={!!sinistro.seguradoraProtocolo} muted={!sinistro.seguradoraProtocolo} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow icon={<PhoneIcon sx={{ color: '#3b82f6' }} />} label="Contato da Seguradora" value={sinistro.seguradoraContato || 'Não informado'} muted={!sinistro.seguradoraContato} />
              </Grid>
            </Grid>
            {!sinistro.seguradoraProtocolo && canEdit && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fef3c7', borderRadius: 1, border: '1px solid #fde68a' }}>
                <Typography variant="body2" color="#92400e">
                  Ainda não foi informado o protocolo da seguradora. Clique em &quot;Editar&quot; para adicionar.
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Tabbed Section: Timeline / Communication / Documents / IA */}
          <Paper sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                borderBottom: '1px solid #e2e8f0',
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
                '& .Mui-selected': { color: '#6366f1' },
                '& .MuiTabs-indicator': { bgcolor: '#6366f1' },
              }}
            >
              <Tab icon={<TimelineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Histórico (${regularHistorico.length})`} />
              <Tab icon={<ChatIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Comunicação (${communications.length})`} />
              <Tab icon={<FolderIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Documentos (${sinistro.documentosIds?.length || 0})`} />
              <Tab icon={<SmartToyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="IA" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Tab 0: Historico */}
              {activeTab === 0 && (
                <>
                  {canEdit && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                      <TextField
                        fullWidth size="small"
                        placeholder="Adicionar atualização ao histórico..."
                        value={historicoText}
                        onChange={(e) => setHistoricoText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddHistorico() } }}
                        multiline maxRows={3}
                      />
                      <IconButton
                        onClick={handleAddHistorico}
                        disabled={!historicoText.trim() || addingHistorico}
                        sx={{ bgcolor: '#6366f1', color: 'white', '&:hover': { bgcolor: '#4f46e5' }, '&:disabled': { bgcolor: '#e2e8f0' }, borderRadius: 2, width: 40, height: 40 }}
                      >
                        {addingHistorico ? <CircularProgress size={18} color="inherit" /> : <SendIcon fontSize="small" />}
                      </IconButton>
                    </Box>
                  )}
                  {regularHistorico.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <TimelineIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                      <Typography color="text.secondary">Nenhum registro no histórico</Typography>
                    </Box>
                  ) : (
                    <Box>
                      {[...regularHistorico].reverse().map((entry, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 0 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24 }}>
                            <Box sx={{
                              width: 12, height: 12, borderRadius: '50%',
                              bgcolor: index === 0 ? '#6366f1' : '#e2e8f0',
                              border: index === 0 ? '3px solid #c7d2fe' : 'none',
                              zIndex: 1, mt: 0.5,
                            }} />
                            {index < regularHistorico.length - 1 && (
                              <Box sx={{ width: 2, flex: 1, bgcolor: '#e2e8f0', minHeight: 30 }} />
                            )}
                          </Box>
                          <Box sx={{ pb: 3, flex: 1 }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#334155' }}>
                              {entry.descricao}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">{formatDateTime(entry.data)}</Typography>
                              {entry.usuario && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PersonIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                                  <Typography variant="caption" color="text.secondary">{entry.usuario}</Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              )}

              {/* Tab 1: Comunicacao */}
              {activeTab === 1 && (
                <>
                  {canEdit && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                        Registrar comunicação com a seguradora
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth size="small"
                          placeholder="Descreva a comunicação realizada..."
                          value={commText}
                          onChange={(e) => setCommText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCommunication() } }}
                          multiline maxRows={4}
                        />
                        <IconButton
                          onClick={handleAddCommunication}
                          disabled={!commText.trim() || addingComm}
                          sx={{ bgcolor: '#3b82f6', color: 'white', '&:hover': { bgcolor: '#2563eb' }, '&:disabled': { bgcolor: '#e2e8f0' }, borderRadius: 2, width: 40, height: 40 }}
                        >
                          {addingComm ? <CircularProgress size={18} color="inherit" /> : <SendIcon fontSize="small" />}
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                  {communications.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ChatIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                      <Typography color="text.secondary">Nenhuma comunicação registrada</Typography>
                      <Typography variant="caption" color="text.secondary">Registre as comunicações com a seguradora para manter o histórico</Typography>
                    </Box>
                  ) : (
                    <Box>
                      {[...communications].reverse().map((entry, index) => (
                        <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#eff6ff', border: '1px solid #dbeafe', boxShadow: 'none' }}>
                          <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#1e40af' }}>
                            {String(entry.descricao).replace('[COMUNICACAO] ', '')}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">{formatDateTime(entry.data)}</Typography>
                            {entry.usuario && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PersonIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                                <Typography variant="caption" color="text.secondary">{entry.usuario}</Typography>
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </>
              )}

              {/* Tab 2: Documentos */}
              {activeTab === 2 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <FolderIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                  {sinistro.documentosIds && sinistro.documentosIds.length > 0 ? (
                    <>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>{sinistro.documentosIds.length} documento(s) vinculado(s)</Typography>
                      {sinistro.documentosIds.map((docId, i) => (
                        <Chip
                          key={i}
                          label={`Documento ${i + 1}`}
                          size="small"
                          onClick={() => router.push(`/dashboard/documentos`)}
                          sx={{ m: 0.5, bgcolor: '#ede9fe', color: '#6366f1', cursor: 'pointer', '&:hover': { bgcolor: '#c7d2fe' } }}
                        />
                      ))}
                    </>
                  ) : (
                    <>
                      <Typography color="text.secondary">Nenhum documento vinculado</Typography>
                      <Typography variant="caption" color="text.secondary">Vincule documentos ao sinistro pela tela de edição</Typography>
                    </>
                  )}
                  {sinistro.fotosUrls && sinistro.fotosUrls.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>{sinistro.fotosUrls.length} foto(s)</Typography>
                      {sinistro.fotosUrls.map((url, i) => (
                        <Chip key={i} label={`Foto ${i + 1}`} size="small" sx={{ m: 0.5, bgcolor: '#fef3c7', color: '#92400e' }} />
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab 3: IA */}
              {activeTab === 3 && (
                <Box>
                  <Paper sx={{ p: 3, mb: 2, background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <SmartToyIcon sx={{ color: '#6366f1' }} />
                      <Typography variant="subtitle1" fontWeight="bold">Rascunho de Comunicação com IA</Typography>
                      <Chip label="Beta" size="small" sx={{ bgcolor: '#6366f1', color: 'white', height: 20, fontSize: '0.7rem' }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      A IA pode gerar um rascunho de comunicação formal para enviar à seguradora sobre este sinistro.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={iaDraftLoading ? <CircularProgress size={16} color="inherit" /> : <SmartToyIcon />}
                      onClick={handleGenerateIaDraft}
                      disabled={iaDraftLoading}
                      sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
                    >
                      {iaDraftLoading ? 'Gerando rascunho...' : 'Gerar Rascunho'}
                    </Button>
                  </Paper>

                  {iaDraft && (
                    <Paper sx={{ p: 3, border: '1px solid #c7d2fe', boxShadow: 'none', bgcolor: '#f5f3ff' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#6366f1' }}>Rascunho Gerado</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Copiar para área de transferência">
                            <IconButton size="small" onClick={handleCopyDraft} sx={{ color: '#6366f1' }}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Button size="small" variant="outlined" onClick={handleUseDraftAsComm} sx={{ borderColor: '#6366f1', color: '#6366f1', textTransform: 'none' }}>
                            Usar como comunicação
                          </Button>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#334155' }}>
                        {iaDraft}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Status Flow Actions */}
          {canEdit && flowActions.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Ações</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {flowActions.map((action) => (
                  <Button
                    key={action.next}
                    variant={action.next === 'CANCELADO' ? 'outlined' : 'contained'}
                    startIcon={statusChanging ? <CircularProgress size={16} color="inherit" /> : action.icon}
                    onClick={() => handleStatusChange(action.next)}
                    disabled={statusChanging}
                    fullWidth
                    sx={{
                      bgcolor: action.next === 'CANCELADO' ? 'transparent' : action.color,
                      borderColor: action.color,
                      color: action.next === 'CANCELADO' ? action.color : 'white',
                      '&:hover': {
                        bgcolor: action.next === 'CANCELADO' ? `${action.color}10` : action.color,
                        filter: action.next === 'CANCELADO' ? 'none' : 'brightness(0.9)',
                      },
                      justifyContent: 'flex-start',
                      py: 1.2,
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            </Paper>
          )}

          {/* Status Flow Visualization */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Fluxo do Status</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(['ABERTO', 'EM_ANALISE', 'APROVADO', 'PAGO'] as StatusSinistro[]).map((status, index) => {
                const isCurrent = sinistro.status === status
                const isPast = getStatusOrder(sinistro.status) > getStatusOrder(status)
                const isTerminal = sinistro.status === 'NEGADO' || sinistro.status === 'CANCELADO'
                const flowSc = statusConfig[status]
                return (
                  <Box key={status}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '50%',
                        bgcolor: isCurrent ? flowSc.color : isPast && !isTerminal ? flowSc.color : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: isPast || isCurrent ? 1 : 0.5,
                      }}>
                        {isPast && !isTerminal ? (
                          <CheckCircleIcon sx={{ fontSize: 18, color: 'white' }} />
                        ) : (
                          <Typography variant="caption" sx={{ color: isCurrent ? 'white' : '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>
                            {index + 1}
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={isCurrent ? 700 : 400}
                        sx={{ color: isCurrent ? flowSc.color : isPast && !isTerminal ? '#334155' : '#94a3b8' }}
                      >
                        {getStatusSinistroLabel(status)}
                      </Typography>
                      {isCurrent && (
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: flowSc.color, animation: 'pulse 2s infinite' }} />
                      )}
                    </Box>
                    {index < 3 && (
                      <Box sx={{ width: 2, height: 20, bgcolor: isPast && !isTerminal ? '#10b981' : '#e2e8f0', ml: '13px', my: 0.3 }} />
                    )}
                  </Box>
                )
              })}
              {(sinistro.status === 'NEGADO' || sinistro.status === 'CANCELADO') && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '50%',
                      bgcolor: statusConfig[sinistro.status].color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {sinistro.status === 'NEGADO' ? (
                        <DoNotDisturbIcon sx={{ fontSize: 16, color: 'white' }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 16, color: 'white' }} />
                      )}
                    </Box>
                    <Typography variant="body2" fontWeight={700} sx={{ color: statusConfig[sinistro.status].color }}>
                      {getStatusSinistroLabel(sinistro.status)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Meta Info */}
          <Paper sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Detalhes</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <DetailRow label="Criado em" value={formatDateTime(sinistro.createdAt)} />
              <DetailRow label="Atualizado em" value={formatDateTime(sinistro.updatedAt)} />
              <DetailRow label="ID" value={sinistro.id} mono />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Editar Sinistro</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Número do Sinistro" value={editData.numeroSinistro || ''} onChange={(e) => setEditData(p => ({ ...p, numeroSinistro: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={editData.tipo || ''} label="Tipo" onChange={(e) => setEditData(p => ({ ...p, tipo: e.target.value as TipoSinistro }))}>
                  <MenuItem value="INCENDIO">Incêndio</MenuItem>
                  <MenuItem value="ROUBO">Roubo</MenuItem>
                  <MenuItem value="DANOS_AGUA">Danos por Água</MenuItem>
                  <MenuItem value="DANOS_ELETRICOS">Danos Elétricos</MenuItem>
                  <MenuItem value="RESPONSABILIDADE_CIVIL">Responsabilidade Civil</MenuItem>
                  <MenuItem value="VENDAVAL">Vendaval</MenuItem>
                  <MenuItem value="OUTROS">Outros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Data da Ocorrência" type="datetime-local" value={editData.dataOcorrencia || ''} onChange={(e) => setEditData(p => ({ ...p, dataOcorrencia: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Data da Comunicação" type="date" value={editData.dataComunicacao || ''} onChange={(e) => setEditData(p => ({ ...p, dataComunicacao: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Local da Ocorrência" value={editData.localOcorrencia || ''} onChange={(e) => setEditData(p => ({ ...p, localOcorrencia: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Cobertura Acionada" value={editData.coberturaAcionada || ''} onChange={(e) => setEditData(p => ({ ...p, coberturaAcionada: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Descrição" multiline rows={3} value={editData.descricao || ''} onChange={(e) => setEditData(p => ({ ...p, descricao: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" label="Valor do Prejuízo (R$)" type="number" value={editData.valorPrejuizo ?? ''} onChange={(e) => setEditData(p => ({ ...p, valorPrejuizo: e.target.value ? parseFloat(e.target.value) : undefined }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" label="Valor da Franquia (R$)" type="number" value={editData.valorFranquia ?? ''} onChange={(e) => setEditData(p => ({ ...p, valorFranquia: e.target.value ? parseFloat(e.target.value) : undefined }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" label="Valor Indenizado (R$)" type="number" value={editData.valorIndenizado ?? ''} onChange={(e) => setEditData(p => ({ ...p, valorIndenizado: e.target.value ? parseFloat(e.target.value) : undefined }))} />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Protocolo da Seguradora</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Número do Protocolo" value={editData.seguradoraProtocolo || ''} onChange={(e) => setEditData(p => ({ ...p, seguradoraProtocolo: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Contato da Seguradora" value={editData.seguradoraContato || ''} onChange={(e) => setEditData(p => ({ ...p, seguradoraContato: e.target.value }))} placeholder="Telefone ou email" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Observações" multiline rows={2} value={editData.observacoes || ''} onChange={(e) => setEditData(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving} sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Registrar Pagamento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Informe o valor indenizado pela seguradora.
          </Typography>
          <TextField
            fullWidth
            label="Valor Indenizado (R$)"
            type="number"
            value={paymentValue}
            onChange={(e) => setPaymentValue(e.target.value ? parseFloat(e.target.value) : '')}
            autoFocus
          />
          {sinistro.valorPrejuizo && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Valor do prejuízo: {formatCurrency(sinistro.valorPrejuizo)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentOpen(false)} disabled={statusChanging}>Cancelar</Button>
          <Button variant="contained" onClick={handlePaymentConfirm} disabled={statusChanging} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
            {statusChanging ? 'Salvando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function getStatusOrder(status: StatusSinistro): number {
  const order: Record<StatusSinistro, number> = {
    ABERTO: 0,
    EM_ANALISE: 1,
    APROVADO: 2,
    PAGO: 3,
    NEGADO: -1,
    CANCELADO: -1,
  }
  return order[status] ?? -1
}

function InfoRow({ icon, label, value, mono, muted }: { icon: React.ReactNode; label: string; value: string; mono?: boolean; muted?: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box sx={{ mt: 0.3 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={500}
          sx={{
            fontFamily: mono ? 'monospace' : 'inherit',
            color: muted ? '#94a3b8' : '#334155',
            fontStyle: muted ? 'italic' : 'normal',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="caption" fontWeight={500} sx={{ fontFamily: mono ? 'monospace' : 'inherit', color: '#334155', maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Typography>
    </Box>
  )
}
