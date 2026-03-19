'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  LinearProgress,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import SyncIcon from '@mui/icons-material/Sync'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SecurityIcon from '@mui/icons-material/Security'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RefreshIcon from '@mui/icons-material/Refresh'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import TimelineIcon from '@mui/icons-material/Timeline'
import BusinessIcon from '@mui/icons-material/Business'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DescriptionIcon from '@mui/icons-material/Description'
import StorageIcon from '@mui/icons-material/Storage'
import PersonIcon from '@mui/icons-material/Person'
import LinkIcon from '@mui/icons-material/Link'
import LabelIcon from '@mui/icons-material/Label'
import DataObjectIcon from '@mui/icons-material/DataObject'
import {
  documentoService,
  formatFileSize,
  getTipoDocumentoLabel,
  getStatusLabel,
  getStatusColor,
} from '@/services/documentoService'
import { condominioService } from '@/services/condominioService'
import {
  DocumentoResponse,
  TipoDocumento,
  CoberturaDTO,
} from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext'

const statusIcons: Record<string, React.ReactElement> = {
  PENDENTE: <HourglassEmptyIcon sx={{ fontSize: 16 }} />,
  PROCESSANDO: <SyncIcon sx={{ fontSize: 16 }} />,
  CONCLUIDO: <CheckCircleIcon sx={{ fontSize: 16 }} />,
  ERRO: <ErrorIcon sx={{ fontSize: 16 }} />,
}

const statusColors: Record<string, string> = {
  PENDENTE: '#f59e0b',
  PROCESSANDO: '#3b82f6',
  CONCLUIDO: '#22c55e',
  ERRO: '#ef4444',
}

export default function DocumentoDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { confirm: confirmDialog } = useConfirmDialog()
  const id = params.id as string

  const [doc, setDoc] = useState<DocumentoResponse | null>(null)
  const [condominioNome, setCondominioNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [reprocessing, setReprocessing] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nome: '', tipo: '' as TipoDocumento, seguradoraNome: '', observacoes: '' })
  const [saving, setSaving] = useState(false)

  // Dados extraidos expanded
  const [showRawData, setShowRawData] = useState(false)

  const canDelete = user?.role === 'ADMIN' || user?.role === 'CORRETORA'
  const canEdit = user?.role === 'ADMIN' || user?.role === 'CORRETORA' || user?.role === 'ADMINISTRADORA'

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const docData = await documentoService.getById(id)
      setDoc(docData)

      try {
        const condData = await condominioService.getById(docData.condominioId)
        setCondominioNome(condData.nome)
      } catch { setCondominioNome('N/A') }

      if (docData.mimeType?.includes('pdf') || docData.mimeType?.includes('image')) {
        try {
          const blob = await documentoService.download(id)
          const blobUrl = URL.createObjectURL(blob)
          setPdfUrl(blobUrl)
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error('Error loading documento:', err)
      setError('Erro ao carregar documento')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [loadData]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const url = await documentoService.getDownloadUrl(id)
      window.open(url, '_blank')
    } catch {
      setError('Erro ao baixar documento')
    } finally {
      setDownloading(false)
    }
  }

  const handleOpenInNewTab = () => {
    if (pdfUrl) window.open(pdfUrl, '_blank')
  }

  const handleReprocess = async () => {
    try {
      setReprocessing(true)
      await documentoService.reprocess(id)
      setSuccess('Documento enviado para reprocessamento')
      loadData()
    } catch {
      setError('Erro ao reprocessar documento')
    } finally {
      setReprocessing(false)
    }
  }

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: 'Confirmar exclusao',
      message: 'Tem certeza que deseja excluir este documento?',
      severity: 'error',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    })
    if (!ok) return
    try {
      await documentoService.delete(id)
      router.push('/dashboard/documentos')
    } catch {
      setError('Erro ao excluir documento')
    }
  }

  const handleOpenEdit = () => {
    if (!doc) return
    setEditForm({
      nome: doc.nome,
      tipo: doc.tipo,
      seguradoraNome: doc.seguradoraNome || '',
      observacoes: doc.observacoes || '',
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    try {
      setSaving(true)
      const updated = await documentoService.updateDocumento(id, {
        nome: editForm.nome,
        tipo: editForm.tipo,
        seguradoraNome: editForm.seguradoraNome || undefined,
        observacoes: editForm.observacoes || undefined,
      })
      setDoc(updated)
      setEditOpen(false)
      setSuccess('Documento atualizado com sucesso')
    } catch {
      setError('Erro ao salvar alteracoes')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const isVencendo = () => {
    if (!doc?.dataVigenciaFim) return false
    const fim = new Date(doc.dataVigenciaFim)
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return fim > now && fim <= thirtyDays
  }

  const isVencido = () => {
    if (!doc?.dataVigenciaFim) return false
    return new Date(doc.dataVigenciaFim) < new Date()
  }

  const diasParaVencer = () => {
    if (!doc?.dataVigenciaFim) return null
    const diff = new Date(doc.dataVigenciaFim).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const coberturas: CoberturaDTO[] = doc?.dadosExtraidos?.coberturas as CoberturaDTO[] || []

  // Build processing timeline
  const getProcessingTimeline = () => {
    const steps = [
      { label: 'Upload', status: 'done', date: doc?.createdAt },
      {
        label: 'Processamento',
        status: doc?.status === 'PENDENTE' ? 'pending' : doc?.status === 'PROCESSANDO' ? 'current' : doc?.status === 'ERRO' ? 'error' : 'done',
        date: doc?.status !== 'PENDENTE' ? doc?.updatedAt : undefined,
      },
      {
        label: 'Concluido',
        status: doc?.status === 'CONCLUIDO' ? 'done' : doc?.status === 'ERRO' ? 'error' : 'pending',
        date: doc?.status === 'CONCLUIDO' ? doc?.updatedAt : undefined,
      },
    ]
    return steps
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!doc) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard/documentos')} sx={{ mb: 2 }}>Voltar</Button>
        <Alert severity="error">Documento nao encontrado</Alert>
      </Box>
    )
  }

  const timeline = getProcessingTimeline()
  const dias = diasParaVencer()

  return (
    <Box sx={{ maxWidth: 1300, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => router.push('/dashboard/documentos')} sx={{ border: '1px solid #e2e8f0' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" fontWeight="bold" noWrap>{doc.nome}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              icon={<LabelIcon sx={{ fontSize: 14 }} />}
              label={getTipoDocumentoLabel(doc.tipo)}
              size="small"
              sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 600, '& .MuiChip-icon': { color: '#6366f1' } }}
            />
            <Chip
              icon={statusIcons[doc.status]}
              label={getStatusLabel(doc.status)}
              size="small"
              sx={{
                bgcolor: `${statusColors[doc.status]}15`,
                color: statusColors[doc.status],
                fontWeight: 600,
                '& .MuiChip-icon': { color: statusColors[doc.status] },
              }}
            />
            {isVencido() && (
              <Chip icon={<ErrorIcon />} label="Vencido" size="small" sx={{ bgcolor: '#fee2e2', color: '#ef4444', fontWeight: 600 }} />
            )}
            {isVencendo() && !isVencido() && dias !== null && (
              <Chip icon={<WarningAmberIcon />} label={`Vence em ${dias} dias`} size="small" sx={{ bgcolor: '#fef3c7', color: '#f59e0b', fontWeight: 600 }} />
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {canEdit && (
            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleOpenEdit} size="small">
              Editar
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
            onClick={handleDownload}
            disabled={downloading}
            size="small"
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Baixar
          </Button>
          {canDelete && (
            <IconButton color="error" onClick={handleDelete} size="small" sx={{ border: '1px solid #fee2e2' }}>
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Left: PDF Preview */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            {/* Preview header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon sx={{ fontSize: 18, color: '#64748b' }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  {doc.nomeArquivo}
                </Typography>
                <Chip label={formatFileSize(doc.tamanhoBytes)} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#f1f5f9' }} />
              </Box>
              {pdfUrl && (
                <Tooltip title="Abrir em nova aba">
                  <IconButton size="small" onClick={handleOpenInNewTab}>
                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {/* Preview content */}
            <Box sx={{ height: 580 }}>
              {doc.mimeType?.includes('pdf') && pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  title="PDF Preview"
                />
              ) : doc.mimeType?.includes('image') && pdfUrl ? (
                <Box
                  sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#f8fafc', cursor: 'pointer' }}
                  onClick={handleOpenInNewTab}
                >
                  <img src={pdfUrl} alt={doc.nome} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#f8fafc' }}>
                  <InsertDriveFileIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Preview nao disponivel
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {doc.mimeType || 'Tipo de arquivo desconhecido'}
                  </Typography>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload}>
                    Baixar para Visualizar
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right: Metadata */}
        <Grid item xs={12} md={5}>
          {/* Processing Timeline */}
          <Paper sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TimelineIcon sx={{ color: '#6366f1', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight="bold">Pipeline de Processamento</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {timeline.map((step, i) => (
                <Box key={step.label} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%',
                    bgcolor: step.status === 'done' ? '#22c55e' : step.status === 'current' ? '#3b82f6' : step.status === 'error' ? '#ef4444' : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1,
                    animation: step.status === 'current' ? 'pulse 2s infinite' : 'none',
                  }}>
                    {step.status === 'done' && <CheckCircleIcon sx={{ fontSize: 16, color: 'white' }} />}
                    {step.status === 'current' && <SyncIcon sx={{ fontSize: 16, color: 'white' }} />}
                    {step.status === 'error' && <ErrorIcon sx={{ fontSize: 16, color: 'white' }} />}
                    {step.status === 'pending' && <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.65rem' }}>{i + 1}</Typography>}
                  </Box>
                  <Typography variant="caption" fontWeight={step.status === 'current' ? 700 : 500} sx={{ mt: 0.5, color: step.status === 'pending' ? '#94a3b8' : '#334155', fontSize: '0.7rem' }}>
                    {step.label}
                  </Typography>
                  {step.date && (
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem' }}>
                      {formatDateShort(step.date)}
                    </Typography>
                  )}
                  {i < timeline.length - 1 && (
                    <Box sx={{
                      position: 'absolute',
                      top: 14,
                      left: '50%',
                      width: '100%',
                      height: 2,
                      bgcolor: step.status === 'done' ? '#22c55e' : '#e2e8f0',
                      zIndex: 0,
                    }} />
                  )}
                </Box>
              ))}
            </Box>
            {doc.erroProcessamento && (
              <Alert severity="error" sx={{ mt: 1.5, py: 0, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                {doc.erroProcessamento}
              </Alert>
            )}
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Acoes Rapidas</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={reprocessing ? <CircularProgress size={14} /> : <RefreshIcon />}
                onClick={handleReprocess}
                disabled={reprocessing || doc.status === 'PROCESSANDO'}
                sx={{ textTransform: 'none', fontSize: '0.75rem' }}
              >
                {reprocessing ? 'Reprocessando...' : 'Reprocessar'}
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<BusinessIcon />}
                onClick={() => router.push(`/dashboard/condominios/${doc.condominioId}`)}
                sx={{ textTransform: 'none', fontSize: '0.75rem' }}
              >
                Ver Condominio
              </Button>
              {(doc.tipo === 'APOLICE' || doc.tipo === 'ORCAMENTO') && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SmartToyIcon />}
                  onClick={() => router.push(`/dashboard/assistente?context=cobertura&from=documentos`)}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', borderColor: '#6366f1', color: '#6366f1' }}
                >
                  Perguntar a IA
                </Button>
              )}
            </Box>
          </Paper>

          {/* File Metadata */}
          <Paper sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Informacoes do Arquivo</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <MetaRow icon={<DescriptionIcon sx={{ fontSize: 16, color: '#64748b' }} />} label="Arquivo" value={doc.nomeArquivo} />
              <MetaRow icon={<StorageIcon sx={{ fontSize: 16, color: '#64748b' }} />} label="Tamanho" value={formatFileSize(doc.tamanhoBytes)} />
              <MetaRow icon={<InsertDriveFileIcon sx={{ fontSize: 16, color: '#64748b' }} />} label="Tipo MIME" value={doc.mimeType || '-'} />
              <MetaRow icon={<CalendarTodayIcon sx={{ fontSize: 16, color: '#64748b' }} />} label="Upload" value={formatDate(doc.createdAt)} />
              <MetaRow icon={<BusinessIcon sx={{ fontSize: 16, color: '#64748b' }} />} label="Condominio" value={condominioNome} />
              {doc.createdBy && (
                <MetaRow icon={<PersonIcon sx={{ fontSize: 16, color: '#64748b' }} />} label="Enviado por" value={doc.createdBy} />
              )}
            </Box>
          </Paper>

          {/* Tags / Classification */}
          <Paper sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <LabelIcon sx={{ color: '#6366f1', fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold">Classificacao</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip label={getTipoDocumentoLabel(doc.tipo)} size="small" sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 600 }} />
              {doc.seguradoraNome && (
                <Chip label={doc.seguradoraNome} size="small" sx={{ bgcolor: '#dbeafe', color: '#3b82f6', fontWeight: 600 }} />
              )}
              <Chip
                label={getStatusLabel(doc.status)}
                size="small"
                sx={{
                  bgcolor: `${statusColors[doc.status]}15`,
                  color: statusColors[doc.status],
                  fontWeight: 600,
                }}
              />
              {doc.dadosExtraidos && Object.keys(doc.dadosExtraidos).length > 0 && (
                <Chip icon={<SmartToyIcon sx={{ fontSize: 14 }} />} label="Dados extraidos" size="small" sx={{ bgcolor: '#f0fdf4', color: '#22c55e', fontWeight: 600, '& .MuiChip-icon': { color: '#22c55e' } }} />
              )}
            </Box>
          </Paper>

          {/* Insurance Data */}
          {(doc.seguradoraNome || doc.valorPremio || doc.dataVigenciaInicio) && (
            <Paper sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Dados do Seguro</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {doc.seguradoraNome && (
                  <MetaRow icon={<SecurityIcon sx={{ fontSize: 16, color: '#3b82f6' }} />} label="Seguradora" value={doc.seguradoraNome} />
                )}
                {doc.valorPremio && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ minWidth: 20, display: 'flex', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: 14, color: '#22c55e', fontWeight: 700 }}>R$</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Valor Premio</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#22c55e' }}>
                        R$ {Number(doc.valorPremio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {doc.dataVigenciaInicio && (
                  <MetaRow
                    icon={<CalendarTodayIcon sx={{ fontSize: 16, color: isVencido() ? '#ef4444' : isVencendo() ? '#f59e0b' : '#64748b' }} />}
                    label="Vigencia"
                    value={`${formatDateShort(doc.dataVigenciaInicio)}${doc.dataVigenciaFim ? ` - ${formatDateShort(doc.dataVigenciaFim)}` : ''}`}
                  />
                )}
              </Box>
            </Paper>
          )}

          {/* Extracted Data */}
          {doc.dadosExtraidos && Object.keys(doc.dadosExtraidos).length > 0 && (
            <Paper sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DataObjectIcon sx={{ color: '#6366f1', fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight="bold">Dados Extraidos pela IA</Typography>
                  <Chip label={`${Object.keys(doc.dadosExtraidos).length} campos`} size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#ede9fe', color: '#6366f1' }} />
                </Box>
                <Button size="small" onClick={() => setShowRawData(!showRawData)} sx={{ textTransform: 'none', fontSize: '0.7rem', color: '#6366f1' }}>
                  {showRawData ? 'Ocultar JSON' : 'Ver JSON'}
                </Button>
              </Box>

              {/* Key extracted fields */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(doc.dadosExtraidos)
                  .filter(([key]) => key !== 'coberturas' && key !== 'condicoesEspeciais')
                  .slice(0, showRawData ? undefined : 6)
                  .map(([key, value]) => (
                    <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 0.5, borderBottom: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="caption" fontWeight={500} sx={{ textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </Typography>
                    </Box>
                  ))}
              </Box>

              {showRawData && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#1e293b', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#94a3b8', whiteSpace: 'pre-wrap', fontSize: '0.7rem' }}>
                    {JSON.stringify(doc.dadosExtraidos, null, 2)}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}

          {/* Coberturas */}
          {coberturas.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <SecurityIcon sx={{ color: '#3b82f6', fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight="bold">
                  Coberturas
                </Typography>
                <Chip label={`${coberturas.filter(c => c.incluido).length}/${coberturas.length}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#dbeafe', color: '#3b82f6' }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 200, overflow: 'auto' }}>
                {coberturas.map((c, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 0.75,
                      borderRadius: 1,
                      bgcolor: c.incluido ? '#f0fdf4' : '#f8fafc',
                      border: '1px solid',
                      borderColor: c.incluido ? '#bbf7d0' : '#e2e8f0',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      {c.incluido ? (
                        <CheckCircleIcon sx={{ fontSize: 14, color: '#22c55e', flexShrink: 0 }} />
                      ) : (
                        <ErrorIcon sx={{ fontSize: 14, color: '#94a3b8', flexShrink: 0 }} />
                      )}
                      <Typography variant="caption" fontWeight={500} noWrap>{c.nome}</Typography>
                    </Box>
                    {c.valorLimite && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                        R$ {Number(c.valorLimite).toLocaleString('pt-BR')}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Observacoes */}
          {doc.observacoes && (
            <Paper sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Observacoes</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{doc.observacoes}</Typography>
            </Paper>
          )}

          {/* Details */}
          <Paper sx={{ p: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Detalhes</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <DetailRow label="ID" value={doc.id} mono />
              <DetailRow label="Criado em" value={formatDate(doc.createdAt)} />
              {doc.updatedAt && <DetailRow label="Atualizado em" value={formatDate(doc.updatedAt)} />}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Editar Documento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Nome" value={editForm.nome}
                onChange={(e) => setEditForm(p => ({ ...p, nome: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={editForm.tipo} label="Tipo"
                  onChange={(e) => setEditForm(p => ({ ...p, tipo: e.target.value as TipoDocumento }))}>
                  <MenuItem value="APOLICE">Apolice</MenuItem>
                  <MenuItem value="ORCAMENTO">Orcamento</MenuItem>
                  <MenuItem value="CONDICOES_GERAIS">Condicoes Gerais</MenuItem>
                  <MenuItem value="LAUDO_VISTORIA">Laudo de Vistoria</MenuItem>
                  <MenuItem value="SINISTRO">Sinistro</MenuItem>
                  <MenuItem value="OUTRO">Outro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Seguradora" value={editForm.seguradoraNome}
                onChange={(e) => setEditForm(p => ({ ...p, seguradoraNome: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Observacoes" multiline rows={3} value={editForm.observacoes}
                onChange={(e) => setEditForm(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving || !editForm.nome}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ minWidth: 20, display: 'flex', justifyContent: 'center' }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={500} noWrap>{value}</Typography>
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
