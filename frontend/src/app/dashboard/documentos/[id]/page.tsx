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
  Card,
  CardContent,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import DescriptionIcon from '@mui/icons-material/Description'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import SyncIcon from '@mui/icons-material/Sync'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PersonIcon from '@mui/icons-material/Person'
import StorageIcon from '@mui/icons-material/Storage'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SecurityIcon from '@mui/icons-material/Security'
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nome: '', tipo: '' as TipoDocumento, seguradoraNome: '', observacoes: '' })
  const [saving, setSaving] = useState(false)

  const canDelete = user?.role === 'ADMIN' || user?.role === 'CORRETORA'

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const docData = await documentoService.getById(id)
      setDoc(docData)

      // Load condominio name
      try {
        const condData = await condominioService.getById(docData.condominioId)
        setCondominioNome(condData.nome)
      } catch { setCondominioNome('N/A') }

      // Load PDF preview URL
      if (docData.mimeType?.includes('pdf')) {
        try {
          const url = await documentoService.getDownloadUrl(id)
          setPdfUrl(url)
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
  }, [loadData])

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const url = await documentoService.getDownloadUrl(id)
      window.open(url, '_blank')
    } catch (err) {
      setError('Erro ao baixar documento')
    } finally {
      setDownloading(false)
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
    } catch (err) {
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
    } catch (err) {
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

  // Extract coberturas from dadosExtraidos
  const coberturas: CoberturaDTO[] = doc?.dadosExtraidos?.coberturas as CoberturaDTO[] || []

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
        <Alert severity="error">Documento nao encontrado</Alert>
      </Box>
    )
  }

  const statusColors: Record<string, string> = {
    PENDENTE: '#f59e0b',
    PROCESSANDO: '#3b82f6',
    CONCLUIDO: '#22c55e',
    ERRO: '#ef4444',
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard/documentos')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">{doc.nome}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
            <Chip label={getTipoDocumentoLabel(doc.tipo)} size="small" variant="outlined" />
            <Chip
              label={getStatusLabel(doc.status)}
              size="small"
              color={getStatusColor(doc.status)}
            />
            {isVencido() && (
              <Chip icon={<ErrorIcon />} label="Vencido" size="small" color="error" />
            )}
            {isVencendo() && !isVencido() && (
              <Chip icon={<WarningAmberIcon />} label="Vencendo" size="small" color="warning" />
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={handleOpenEdit}>
            Editar
          </Button>
          <Button
            variant="contained"
            startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
            onClick={handleDownload}
            disabled={downloading}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Baixar
          </Button>
          {canDelete && (
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
              Excluir
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      <Grid container spacing={3}>
        {/* Left: PDF Preview */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 0, overflow: 'hidden', height: 600 }}>
            {doc.mimeType?.includes('pdf') && pdfUrl ? (
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="PDF Preview"
              />
            ) : doc.mimeType?.includes('image') && pdfUrl ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#f8fafc' }}>
                <img src={pdfUrl} alt={doc.nome} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#f8fafc' }}>
                <InsertDriveFileIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                  Preview nao disponivel
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clique em "Baixar" para visualizar o documento
                </Typography>
                <Button variant="outlined" sx={{ mt: 2 }} onClick={handleDownload}>
                  Baixar Documento
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right: Metadata */}
        <Grid item xs={12} md={5}>
          {/* File Info */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Informacoes do Arquivo</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Arquivo</Typography>
                <Typography variant="body2" fontWeight={500}>{doc.nomeArquivo}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Tamanho</Typography>
                <Typography variant="body2" fontWeight={500}>{formatFileSize(doc.tamanhoBytes)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Tipo MIME</Typography>
                <Typography variant="body2" fontWeight={500}>{doc.mimeType || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Upload</Typography>
                <Typography variant="body2" fontWeight={500}>{formatDate(doc.createdAt)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Condominio</Typography>
                <Typography variant="body2" fontWeight={500}>{condominioNome}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Seguro Info */}
          {(doc.seguradoraNome || doc.valorPremio || doc.dataVigenciaInicio) && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Dados do Seguro</Typography>
              <Grid container spacing={1.5}>
                {doc.seguradoraNome && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Seguradora</Typography>
                    <Typography variant="body2" fontWeight={500}>{doc.seguradoraNome}</Typography>
                  </Grid>
                )}
                {doc.valorPremio && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Valor Premio</Typography>
                    <Typography variant="body2" fontWeight="bold" color="#16a34a">
                      R$ {Number(doc.valorPremio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                )}
                {doc.dataVigenciaInicio && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Vigencia</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(doc.dataVigenciaInicio).toLocaleDateString('pt-BR')}
                      {doc.dataVigenciaFim && ` - ${new Date(doc.dataVigenciaFim).toLocaleDateString('pt-BR')}`}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Observacoes */}
          {doc.observacoes && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Observacoes</Typography>
              <Typography variant="body2">{doc.observacoes}</Typography>
            </Paper>
          )}

          {/* Coberturas */}
          {coberturas.length > 0 && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <SecurityIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Coberturas ({coberturas.filter(c => c.incluido).length}/{coberturas.length})
                </Typography>
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
                        <CheckCircleIcon sx={{ fontSize: 14, color: '#22c55e' }} />
                      ) : (
                        <ErrorIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
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

          {/* Error */}
          {doc.erroProcessamento && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={500}>Erro de Processamento</Typography>
              <Typography variant="caption">{doc.erroProcessamento}</Typography>
            </Alert>
          )}
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Documento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Nome"
                value={editForm.nome}
                onChange={(e) => setEditForm(p => ({ ...p, nome: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={editForm.tipo}
                  label="Tipo"
                  onChange={(e) => setEditForm(p => ({ ...p, tipo: e.target.value as TipoDocumento }))}
                >
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
              <TextField
                fullWidth
                size="small"
                label="Seguradora"
                value={editForm.seguradoraNome}
                onChange={(e) => setEditForm(p => ({ ...p, seguradoraNome: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Observacoes"
                multiline
                rows={3}
                value={editForm.observacoes}
                onChange={(e) => setEditForm(p => ({ ...p, observacoes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving || !editForm.nome}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
