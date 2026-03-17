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
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext'
import {
  sinistroService,
  getTipoSinistroLabel,
  getStatusSinistroLabel,
} from '@/services/sinistroService'
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
    { next: 'EM_ANALISE', label: 'Iniciar Analise', icon: <PlayArrowIcon />, color: '#3b82f6' },
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
      setSuccess('Historico adicionado')
      loadSinistro()
    } catch (err) {
      console.error('Error adding historico:', err)
      setError('Erro ao adicionar historico')
    } finally {
      setAddingHistorico(false)
    }
  }

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: 'Confirmar exclusao',
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
        <Alert severity="error">Sinistro nao encontrado</Alert>
      </Box>
    )
  }

  const sc = statusConfig[sinistro.status] || statusConfig.CANCELADO
  const isOpen = sinistro.status === 'ABERTO' || sinistro.status === 'EM_ANALISE'
  const dias = getDiasAberto()
  const flowActions = statusFlowConfig[sinistro.status] || []

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard/sinistros')} sx={{ border: '1px solid #e2e8f0' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Sinistro {sinistro.numeroSinistro ? `#${sinistro.numeroSinistro}` : ''}
            </Typography>
            <Chip
              label={getStatusSinistroLabel(sinistro.status)}
              sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.8rem', height: 28 }}
            />
            {isOpen && (
              <Chip
                label={`${dias} dias`}
                size="small"
                sx={{
                  bgcolor: dias > 90 ? '#fee2e2' : dias > 60 ? '#fef3c7' : dias > 30 ? '#dbeafe' : '#f1f5f9',
                  color: dias > 90 ? '#ef4444' : dias > 60 ? '#f59e0b' : dias > 30 ? '#3b82f6' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '0.75rem',
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
              Informacoes do Sinistro
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InfoRow icon={<BusinessIcon sx={{ color: '#6366f1' }} />} label="Condominio" value={sinistro.condominioNome} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow icon={<ReportProblemIcon sx={{ color: '#f59e0b' }} />} label="Tipo" value={getTipoSinistroLabel(sinistro.tipo)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow icon={<CalendarTodayIcon sx={{ color: '#3b82f6' }} />} label="Data da Ocorrencia" value={formatDateTime(sinistro.dataOcorrencia)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow icon={<CalendarTodayIcon sx={{ color: '#10b981' }} />} label="Data da Comunicacao" value={formatDate(sinistro.dataComunicacao)} />
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
                  <InfoRow icon={<ReceiptLongIcon sx={{ color: '#6366f1' }} />} label="Numero do Sinistro" value={sinistro.numeroSinistro} mono />
                </Grid>
              )}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Descricao
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#334155' }}>
                  {sinistro.descricao}
                </Typography>
              </Grid>
              {sinistro.observacoes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Observacoes
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
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Valores
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', boxShadow: 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      VALOR DO PREJUIZO
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#ef4444' }}>
                    {formatCurrency(sinistro.valorPrejuizo)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', boxShadow: 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AttachMoneyIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      VALOR DA FRANQUIA
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#f59e0b' }}>
                    {formatCurrency(sinistro.valorFranquia)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AttachMoneyIcon sx={{ color: '#22c55e', fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      VALOR INDENIZADO
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#22c55e' }}>
                    {formatCurrency(sinistro.valorIndenizado)}
                  </Typography>
                </Paper>
              </Grid>
              {sinistro.valorPrejuizo && sinistro.valorIndenizado && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Cobertura: {((sinistro.valorIndenizado / sinistro.valorPrejuizo) * 100).toFixed(1)}%
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((sinistro.valorIndenizado / sinistro.valorPrejuizo) * 100, 100)}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#fee2e2', '& .MuiLinearProgress-bar': { bgcolor: '#22c55e', borderRadius: 4 } }}
                      />
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Protocolo Seguradora */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Protocolo da Seguradora
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InfoRow
                  icon={<ReceiptLongIcon sx={{ color: '#6366f1' }} />}
                  label="Numero do Protocolo"
                  value={sinistro.seguradoraProtocolo || 'Nao informado'}
                  mono={!!sinistro.seguradoraProtocolo}
                  muted={!sinistro.seguradoraProtocolo}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow
                  icon={<PhoneIcon sx={{ color: '#3b82f6' }} />}
                  label="Contato da Seguradora"
                  value={sinistro.seguradoraContato || 'Nao informado'}
                  muted={!sinistro.seguradoraContato}
                />
              </Grid>
            </Grid>
            {!sinistro.seguradoraProtocolo && canEdit && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fef3c7', borderRadius: 1, border: '1px solid #fde68a' }}>
                <Typography variant="body2" color="#92400e">
                  Ainda nao foi informado o protocolo da seguradora. Clique em &quot;Editar&quot; para adicionar.
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Timeline / Historico */}
          <Paper sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TimelineIcon sx={{ color: '#6366f1' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Historico
              </Typography>
              <Chip label={sinistro.historico?.length || 0} size="small" sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 700, height: 22 }} />
            </Box>

            {/* Add historico */}
            {canEdit && (
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Adicionar atualizacao ao historico..."
                  value={historicoText}
                  onChange={(e) => setHistoricoText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddHistorico() } }}
                  multiline
                  maxRows={3}
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

            {/* Timeline entries */}
            {(!sinistro.historico || sinistro.historico.length === 0) ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TimelineIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                <Typography color="text.secondary">Nenhum registro no historico</Typography>
              </Box>
            ) : (
              <Box>
                {[...sinistro.historico].reverse().map((entry, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 0 }}>
                    {/* Timeline line */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24 }}>
                      <Box sx={{
                        width: 12, height: 12, borderRadius: '50%',
                        bgcolor: index === 0 ? '#6366f1' : '#e2e8f0',
                        border: index === 0 ? '3px solid #c7d2fe' : 'none',
                        zIndex: 1,
                        mt: 0.5,
                      }} />
                      {index < sinistro.historico!.length - 1 && (
                        <Box sx={{ width: 2, flex: 1, bgcolor: '#e2e8f0', minHeight: 30 }} />
                      )}
                    </Box>
                    {/* Content */}
                    <Box sx={{ pb: 3, flex: 1 }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#334155' }}>
                        {entry.descricao}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(entry.data)}
                        </Typography>
                        {entry.usuario && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Typography variant="caption" color="text.secondary">
                              {entry.usuario}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Status Flow */}
          {canEdit && flowActions.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Acoes
              </Typography>
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
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Fluxo do Status
            </Typography>
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
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Detalhes
            </Typography>
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
              <TextField fullWidth size="small" label="Numero do Sinistro" value={editData.numeroSinistro || ''} onChange={(e) => setEditData(p => ({ ...p, numeroSinistro: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={editData.tipo || ''} label="Tipo" onChange={(e) => setEditData(p => ({ ...p, tipo: e.target.value as TipoSinistro }))}>
                  <MenuItem value="INCENDIO">Incendio</MenuItem>
                  <MenuItem value="ROUBO">Roubo</MenuItem>
                  <MenuItem value="DANOS_AGUA">Danos por Agua</MenuItem>
                  <MenuItem value="DANOS_ELETRICOS">Danos Eletricos</MenuItem>
                  <MenuItem value="RESPONSABILIDADE_CIVIL">Responsabilidade Civil</MenuItem>
                  <MenuItem value="VENDAVAL">Vendaval</MenuItem>
                  <MenuItem value="OUTROS">Outros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Data da Ocorrencia" type="datetime-local" value={editData.dataOcorrencia || ''} onChange={(e) => setEditData(p => ({ ...p, dataOcorrencia: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Data da Comunicacao" type="date" value={editData.dataComunicacao || ''} onChange={(e) => setEditData(p => ({ ...p, dataComunicacao: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Local da Ocorrencia" value={editData.localOcorrencia || ''} onChange={(e) => setEditData(p => ({ ...p, localOcorrencia: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Cobertura Acionada" value={editData.coberturaAcionada || ''} onChange={(e) => setEditData(p => ({ ...p, coberturaAcionada: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Descricao" multiline rows={3} value={editData.descricao || ''} onChange={(e) => setEditData(p => ({ ...p, descricao: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" label="Valor do Prejuizo (R$)" type="number" value={editData.valorPrejuizo ?? ''} onChange={(e) => setEditData(p => ({ ...p, valorPrejuizo: e.target.value ? parseFloat(e.target.value) : undefined }))} />
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
              <TextField fullWidth size="small" label="Numero do Protocolo" value={editData.seguradoraProtocolo || ''} onChange={(e) => setEditData(p => ({ ...p, seguradoraProtocolo: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Contato da Seguradora" value={editData.seguradoraContato || ''} onChange={(e) => setEditData(p => ({ ...p, seguradoraContato: e.target.value }))} placeholder="Telefone ou email" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Observacoes" multiline rows={2} value={editData.observacoes || ''} onChange={(e) => setEditData(p => ({ ...p, observacoes: e.target.value }))} />
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
              Valor do prejuizo: {formatCurrency(sinistro.valorPrejuizo)}
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
