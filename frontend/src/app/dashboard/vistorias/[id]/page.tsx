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
  LinearProgress,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import WarningIcon from '@mui/icons-material/Warning'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import PendingIcon from '@mui/icons-material/Pending'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'
import DescriptionIcon from '@mui/icons-material/Description'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import LinkIcon from '@mui/icons-material/Link'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CloseIcon from '@mui/icons-material/Close'
import {
  vistoriaService,
  getTipoVistoriaLabel,
  getStatusVistoriaLabel,
  getStatusVistoriaColor,
} from '@/services/vistoriaService'
import {
  VistoriaResponse,
  VistoriaItem,
  VistoriaFoto,
  StatusItem,
  SeveridadeItem,
  StatusVistoria,
} from '@/types'

const STATUS_ITEM_CONFIG: Record<StatusItem, { label: string; color: string; icon: React.ReactNode }> = {
  PENDENTE: { label: 'Pendente', color: '#94a3b8', icon: <PendingIcon fontSize="small" /> },
  CONFORME: { label: 'Conforme', color: '#22c55e', icon: <CheckCircleIcon fontSize="small" /> },
  NAO_CONFORME: { label: 'Não Conforme', color: '#ef4444', icon: <CancelIcon fontSize="small" /> },
  NA: { label: 'N/A', color: '#a78bfa', icon: <HelpOutlineIcon fontSize="small" /> },
}

const SEVERIDADE_CONFIG: Record<SeveridadeItem, { label: string; color: string }> = {
  BAIXA: { label: 'Baixa', color: '#3b82f6' },
  MEDIA: { label: 'Média', color: '#f59e0b' },
  ALTA: { label: 'Alta', color: '#f97316' },
  CRITICA: { label: 'Crítica', color: '#ef4444' },
}

export default function VistoriaDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [vistoria, setVistoria] = useState<VistoriaResponse | null>(null)
  const [itens, setItens] = useState<VistoriaItem[]>([])
  const [fotos, setFotos] = useState<VistoriaFoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [generatingLaudo, setGeneratingLaudo] = useState(false)

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoDragOver, setPhotoDragOver] = useState(false)

  // Laudo dialog
  const [laudoDialogOpen, setLaudoDialogOpen] = useState(false)

  // Share link
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [revokingLink, setRevokingLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [vistoriaData, itensData, fotosData] = await Promise.all([
        vistoriaService.getById(id),
        vistoriaService.getItens(id),
        vistoriaService.getFotos(id),
      ])
      setVistoria(vistoriaData)
      setFotos(fotosData)
      // Auto-carrega checklist padrão se vistoria estiver vazia
      if (itensData.length === 0) {
        try {
          const loaded = await vistoriaService.loadDefaultChecklist(id)
          setItens(loaded)
          const refreshed = await vistoriaService.getById(id)
          setVistoria(refreshed)
        } catch (e) {
          console.error('Error auto-loading checklist:', e)
          setItens(itensData)
        }
      } else {
        setItens(itensData)
      }
    } catch (err) {
      console.error('Error loading vistoria:', err)
      setError('Erro ao carregar vistoria')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLoadDefaultChecklist = async () => {
    try {
      setSaving(true)
      const newItens = await vistoriaService.loadDefaultChecklist(id)
      setItens(newItens)
      // Reload vistoria to get updated counts
      const v = await vistoriaService.getById(id)
      setVistoria(v)
    } catch (err) {
      console.error('Error loading checklist:', err)
      setError('Erro ao carregar checklist padrão')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateItemStatus = async (item: VistoriaItem, newStatus: StatusItem) => {
    try {
      await vistoriaService.updateItem(id, item.id, { ...item, status: newStatus })
      const [updatedItens, updatedVistoria] = await Promise.all([
        vistoriaService.getItens(id),
        vistoriaService.getById(id),
      ])
      setItens(updatedItens)
      setVistoria(updatedVistoria)
    } catch (err) {
      console.error('Error updating item:', err)
      setError('Erro ao atualizar item')
    }
  }

  const handlePhotoUpload = async (file: File) => {
    try {
      setUploadingPhoto(true)
      // Create a URL for the photo - in production this would upload to MinIO
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        await vistoriaService.addFoto(id, {
          url: base64,
          descricao: file.name,
        })
        const updatedFotos = await vistoriaService.getFotos(id)
        setFotos(updatedFotos)
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error uploading photo:', err)
      setError('Erro ao enviar foto')
      setUploadingPhoto(false)
    }
  }

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setPhotoDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) handlePhotoUpload(files[0])
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handlePhotoUpload(file)
  }

  const handleDeleteFoto = async (fotoId: string) => {
    try {
      await vistoriaService.deleteFoto(id, fotoId)
      const updatedFotos = await vistoriaService.getFotos(id)
      setFotos(updatedFotos)
    } catch (err) {
      console.error('Error deleting foto:', err)
      setError('Erro ao remover foto')
    }
  }

  const handleUpdateStatus = async (newStatus: StatusVistoria) => {
    try {
      setSaving(true)
      const updated = await vistoriaService.update(id, { status: newStatus })
      setVistoria(updated)
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Erro ao atualizar status')
    } finally {
      setSaving(false)
    }
  }

  const handleGerarLaudo = async () => {
    try {
      setGeneratingLaudo(true)
      const updated = await vistoriaService.gerarLaudo(id)
      setVistoria(updated)
      setLaudoDialogOpen(true)
    } catch (err) {
      console.error('Error generating laudo:', err)
      setError('Erro ao gerar laudo')
    } finally {
      setGeneratingLaudo(false)
    }
  }

  const handleGenerateLink = async () => {
    try {
      setGeneratingLink(true)
      const result = await vistoriaService.generateLink(id)
      const updated = await vistoriaService.getById(id)
      setVistoria(updated)
      setShareDialogOpen(true)
    } catch (err) {
      console.error('Error generating link:', err)
      setError('Erro ao gerar link externo')
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleRevokeLink = async () => {
    try {
      setRevokingLink(true)
      await vistoriaService.revokeLink(id)
      const updated = await vistoriaService.getById(id)
      setVistoria(updated)
      setShareDialogOpen(false)
    } catch (err) {
      console.error('Error revoking link:', err)
      setError('Erro ao revogar link externo')
    } finally {
      setRevokingLink(false)
    }
  }

  const getShareUrl = () => {
    if (!vistoria?.sharedToken) return ''
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return `${base}/vistoria-externa/${vistoria.sharedToken}`
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      setError('Erro ao copiar link')
    }
  }

  // Group items by category
  const groupedItens = itens.reduce((acc, item) => {
    const cat = item.categoria || 'Outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, VistoriaItem[]>)

  // Stats
  const totalItens = itens.length
  const conformes = itens.filter((i) => i.status === 'CONFORME').length
  const naoConformes = itens.filter((i) => i.status === 'NAO_CONFORME').length
  const pendentes = itens.filter((i) => i.status === 'PENDENTE').length
  const progressPercent = totalItens > 0 ? ((totalItens - pendentes) / totalItens) * 100 : 0
  const scorePercent = totalItens > 0 ? (conformes / totalItens) * 100 : 0

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!vistoria) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Alert severity="error">Vistoria não encontrada</Alert>
      </Box>
    )
  }

  const isReadOnly = vistoria.status === 'CONCLUIDA' || vistoria.status === 'CANCELADA'

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard/vistorias')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            Vistoria - {vistoria.condominioNome}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip
              label={getTipoVistoriaLabel(vistoria.tipo)}
              size="small"
              variant="outlined"
            />
            <Chip
              label={getStatusVistoriaLabel(vistoria.status)}
              size="small"
              color={getStatusVistoriaColor(vistoria.status)}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {vistoria.sharedToken ? (
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={() => setShareDialogOpen(true)}
              size="small"
              color="success"
              sx={{ borderColor: '#22c55e', color: '#16a34a' }}
            >
              Link Ativo
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={generatingLink ? <CircularProgress size={16} /> : <LinkIcon />}
              onClick={handleGenerateLink}
              disabled={generatingLink}
              size="small"
              sx={{ borderColor: '#e2e8f0' }}
            >
              {generatingLink ? 'Gerando...' : 'Gerar Link'}
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Total Itens</Typography>
              <Typography variant="h4" fontWeight="bold" color="#0284c7">{totalItens}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Conformes</Typography>
              <Typography variant="h4" fontWeight="bold" color="#16a34a">{conformes}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Não Conformes</Typography>
              <Typography variant="h4" fontWeight="bold" color="#dc2626">{naoConformes}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: scorePercent >= 80 ? '#f0fdf4' : scorePercent >= 60 ? '#fffbeb' : '#fef2f2', border: `1px solid ${scorePercent >= 80 ? '#bbf7d0' : scorePercent >= 60 ? '#fde68a' : '#fecaca'}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Nota Geral</Typography>
              <Typography variant="h4" fontWeight="bold" color={scorePercent >= 80 ? '#16a34a' : scorePercent >= 60 ? '#d97706' : '#dc2626'}>
                {vistoria.notaGeral ?? '-'}<Typography component="span" variant="body2" color="text.secondary">/10</Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Bar */}
      {totalItens > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={500}>Progresso da Vistoria</Typography>
            <Typography variant="body2" color="text.secondary">
              {totalItens - pendentes}/{totalItens} avaliados ({Math.round(progressPercent)}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: '#e2e8f0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: progressPercent === 100 ? '#22c55e' : '#3b82f6',
              },
            }}
          />
        </Paper>
      )}

      {/* Info */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary">Data Agendada</Typography>
            <Typography variant="body2" fontWeight={500}>
              {new Date(vistoria.dataAgendada).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Grid>
          {vistoria.dataRealizada && (
            <Grid item xs={12} md={3}>
              <Typography variant="caption" color="text.secondary">Data Realizada</Typography>
              <Typography variant="body2" fontWeight={500}>
                {new Date(vistoria.dataRealizada).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Grid>
          )}
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary">Responsável</Typography>
            <Typography variant="body2" fontWeight={500}>{vistoria.responsavelNome || '-'}</Typography>
          </Grid>
          {vistoria.responsavelEmail && (
            <Grid item xs={12} md={3}>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography variant="body2" fontWeight={500}>{vistoria.responsavelEmail}</Typography>
            </Grid>
          )}
          {vistoria.responsavelTelefone && (
            <Grid item xs={12} md={3}>
              <Typography variant="caption" color="text.secondary">Telefone</Typography>
              <Typography variant="body2" fontWeight={500}>{vistoria.responsavelTelefone}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Checklist */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlaylistAddCheckIcon sx={{ color: '#3b82f6' }} />
            <Typography variant="h6" fontWeight="bold">Checklist de Vistoria</Typography>
            {totalItens > 0 && (
              <Chip label={`${totalItens} itens`} size="small" variant="outlined" />
            )}
          </Box>
          {totalItens > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {Object.entries(STATUS_ITEM_CONFIG).map(([key, config]) => {
                const count = itens.filter((i) => i.status === key).length
                if (count === 0) return null
                return (
                  <Chip
                    key={key}
                    icon={config.icon as React.ReactElement}
                    label={`${count} ${config.label}`}
                    size="small"
                    sx={{ bgcolor: `${config.color}15`, color: config.color, fontWeight: 500 }}
                  />
                )
              })}
            </Box>
          )}
        </Box>

        {totalItens === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <PlaylistAddCheckIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              Nenhum item de checklist
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Carregue o checklist padrão com 25 itens para começar a vistoria
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedItens).map(([categoria, items]) => {
            const catConformes = items.filter((i) => i.status === 'CONFORME').length
            const catTotal = items.length
            const catPercent = catTotal > 0 ? (catConformes / catTotal) * 100 : 0

            return (
              <Accordion key={categoria} defaultExpanded sx={{ mb: 1, '&:before': { display: 'none' } }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ bgcolor: '#f8fafc', borderRadius: 1, '&.Mui-expanded': { minHeight: 48 } }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                      {categoria}
                    </Typography>
                    <Chip
                      label={`${catConformes}/${catTotal}`}
                      size="small"
                      sx={{
                        bgcolor: catPercent === 100 ? '#dcfce7' : catPercent > 0 ? '#fef3c7' : '#f1f5f9',
                        color: catPercent === 100 ? '#16a34a' : catPercent > 0 ? '#d97706' : '#64748b',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  {items.map((item, idx) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1.5,
                        borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none',
                        bgcolor: item.status === 'NAO_CONFORME' ? '#fef2f2' : 'white',
                        '&:hover': { bgcolor: item.status === 'NAO_CONFORME' ? '#fee2e2' : '#f8fafc' },
                      }}
                    >
                      {/* Status buttons */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {(['CONFORME', 'NAO_CONFORME', 'NA'] as StatusItem[]).map((st) => {
                          const cfg = STATUS_ITEM_CONFIG[st]
                          const isActive = item.status === st
                          return (
                            <Tooltip key={st} title={isReadOnly ? `${cfg.label} (somente leitura)` : cfg.label}>
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={isReadOnly}
                                  onClick={() => handleUpdateItemStatus(item, isActive ? 'PENDENTE' : st)}
                                  sx={{
                                    bgcolor: isActive ? `${cfg.color}20` : 'transparent',
                                    color: isActive ? cfg.color : '#94a3b8',
                                    border: isActive ? `2px solid ${cfg.color}` : '2px solid transparent',
                                    '&:hover': { bgcolor: `${cfg.color}15`, color: cfg.color },
                                    '&.Mui-disabled': { color: isActive ? cfg.color : '#d1d5db', opacity: 0.7 },
                                  }}
                                >
                                  {cfg.icon}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )
                        })}
                      </Box>

                      {/* Description */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            textDecoration: item.status === 'NA' ? 'line-through' : 'none',
                            color: item.status === 'NA' ? '#94a3b8' : 'text.primary',
                          }}
                        >
                          {item.descricao}
                        </Typography>
                        {item.observacao && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                            {item.observacao}
                          </Typography>
                        )}
                      </Box>

                      {/* Severity badge (only for NAO_CONFORME) */}
                      {item.status === 'NAO_CONFORME' && (
                        <Chip
                          label={SEVERIDADE_CONFIG[item.severidade]?.label || item.severidade}
                          size="small"
                          sx={{
                            bgcolor: `${SEVERIDADE_CONFIG[item.severidade]?.color || '#94a3b8'}15`,
                            color: SEVERIDADE_CONFIG[item.severidade]?.color || '#94a3b8',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            )
          })
        )}
      </Paper>

      {/* Observacoes */}
      {vistoria.observacoes && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WarningIcon sx={{ color: '#f59e0b' }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#92400e' }}>Observações</Typography>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#78350f', lineHeight: 1.7 }}>
            {vistoria.observacoes}
          </Typography>
        </Paper>
      )}

      {/* Fotos da Vistoria */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCameraIcon sx={{ color: '#3b82f6' }} />
            <Typography variant="h6" fontWeight="bold">Fotos da Vistoria</Typography>
            <Chip label={fotos.length} size="small" sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 700, height: 22 }} />
          </Box>
          {!isReadOnly && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CloudUploadIcon />}
              component="label"
              disabled={uploadingPhoto}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              {uploadingPhoto ? 'Enviando...' : 'Adicionar Foto'}
              <input type="file" hidden accept="image/*" onChange={handlePhotoSelect} />
            </Button>
          )}
        </Box>

        {/* Drag and Drop */}
        {!isReadOnly && (
          <Box
            onDragOver={(e) => { e.preventDefault(); setPhotoDragOver(true) }}
            onDragLeave={() => setPhotoDragOver(false)}
            onDrop={handlePhotoDrop}
            component="label"
            sx={{
              p: 3,
              mb: 2,
              border: `2px dashed ${photoDragOver ? '#3b82f6' : '#e2e8f0'}`,
              borderRadius: 2,
              bgcolor: photoDragOver ? '#dbeafe' : '#fafafa',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { borderColor: '#3b82f6', bgcolor: '#eff6ff' },
            }}
          >
            <PhotoCameraIcon sx={{ fontSize: 36, color: photoDragOver ? '#3b82f6' : '#94a3b8', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Arraste fotos aqui ou clique para selecionar
            </Typography>
            <Typography variant="caption" color="text.secondary">
              JPG, PNG, WEBP
            </Typography>
            <input type="file" hidden accept="image/*" onChange={handlePhotoSelect} />
          </Box>
        )}

        {/* Photo Grid */}
        {fotos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <PhotoCameraIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              Nenhuma foto adicionada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isReadOnly ? 'Nenhuma foto foi registrada para esta vistoria' : 'Adicione fotos para documentar a vistoria'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {fotos.map((foto) => (
              <Grid item xs={6} sm={4} md={3} key={foto.id}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    aspectRatio: '4/3',
                    bgcolor: '#f1f5f9',
                    '&:hover .photo-overlay': { opacity: 1 },
                  }}
                >
                  <Box
                    component="img"
                    src={foto.url}
                    alt={foto.descricao || 'Foto da vistoria'}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {!isReadOnly && (
                    <Box
                      className="photo-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        p: 0.5,
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFoto(foto.id)}
                        sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(239,68,68,0.8)' } }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  {foto.descricao && (
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 0.5, bgcolor: 'rgba(0,0,0,0.5)' }}>
                      <Typography variant="caption" sx={{ color: 'white', fontSize: '0.65rem' }} noWrap>
                        {foto.descricao}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Laudo Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ color: '#3b82f6' }} />
            <Typography variant="h6" fontWeight="bold">Laudo Técnico</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={generatingLaudo ? <CircularProgress size={16} color="inherit" /> : <AssignmentTurnedInIcon />}
            onClick={handleGerarLaudo}
            disabled={generatingLaudo || totalItens === 0}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            {generatingLaudo ? 'Gerando...' : vistoria.laudoTexto ? 'Regerar Laudo' : 'Gerar Laudo'}
          </Button>
        </Box>

        {vistoria.laudoTexto ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Laudo gerado em {vistoria.laudoGeradoEm ? new Date(vistoria.laudoGeradoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'data desconhecida'}
            </Alert>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                maxHeight: 400,
                overflow: 'auto',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                fontSize: '0.85rem',
                lineHeight: 1.6,
              }}
            >
              {vistoria.laudoTexto}
            </Paper>
            <Button
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={() => setLaudoDialogOpen(true)}
            >
              Ver Laudo Completo
            </Button>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <DescriptionIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              Nenhum laudo gerado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalItens === 0
                ? 'Carregue o checklist e avalie os itens antes de gerar o laudo'
                : 'Avalie os itens do checklist e clique em "Gerar Laudo"'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Laudo Full Dialog */}
      <Dialog open={laudoDialogOpen} onClose={() => setLaudoDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ color: '#3b82f6' }} />
            Laudo Tecnico - {vistoria.condominioNome}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              bgcolor: '#f8fafc',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              fontSize: '0.9rem',
              lineHeight: 1.7,
            }}
          >
            {vistoria.laudoTexto || 'Nenhum laudo gerado'}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLaudoDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Share Link Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon sx={{ color: '#22c55e' }} />
            Link Externo da Vistoria
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Qualquer pessoa com este link pode visualizar os dados da vistoria sem precisar de login.
          </Alert>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              wordBreak: 'break-all',
            }}
          >
            <Typography variant="body2" sx={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {getShareUrl()}
            </Typography>
            <Tooltip title={linkCopied ? 'Copiado!' : 'Copiar link'}>
              <IconButton onClick={handleCopyLink} color={linkCopied ? 'success' : 'default'} size="small">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Abrir em nova aba">
              <IconButton
                size="small"
                onClick={() => window.open(getShareUrl(), '_blank')}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button
            color="error"
            startIcon={revokingLink ? <CircularProgress size={16} /> : <LinkOffIcon />}
            onClick={handleRevokeLink}
            disabled={revokingLink}
            size="small"
          >
            {revokingLink ? 'Revogando...' : 'Revogar Link'}
          </Button>
          <Button onClick={() => setShareDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
