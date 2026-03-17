'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import PendingIcon from '@mui/icons-material/Pending'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'
import DescriptionIcon from '@mui/icons-material/Description'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import WarningIcon from '@mui/icons-material/Warning'
import ShareIcon from '@mui/icons-material/Share'
import { fetchExternalVistoria } from '@/services/vistoriaService'
import {
  getTipoVistoriaLabel,
  getStatusVistoriaLabel,
  getStatusVistoriaColor,
} from '@/services/vistoriaService'
import {
  ExternalVistoriaResponse,
  VistoriaItem,
  StatusItem,
  SeveridadeItem,
} from '@/types'

const STATUS_ITEM_CONFIG: Record<StatusItem, { label: string; color: string; icon: React.ReactNode }> = {
  PENDENTE: { label: 'Pendente', color: '#94a3b8', icon: <PendingIcon fontSize="small" /> },
  CONFORME: { label: 'Conforme', color: '#22c55e', icon: <CheckCircleIcon fontSize="small" /> },
  NAO_CONFORME: { label: 'Nao Conforme', color: '#ef4444', icon: <CancelIcon fontSize="small" /> },
  NA: { label: 'N/A', color: '#a78bfa', icon: <HelpOutlineIcon fontSize="small" /> },
}

const SEVERIDADE_CONFIG: Record<SeveridadeItem, { label: string; color: string }> = {
  BAIXA: { label: 'Baixa', color: '#3b82f6' },
  MEDIA: { label: 'Media', color: '#f59e0b' },
  ALTA: { label: 'Alta', color: '#f97316' },
  CRITICA: { label: 'Critica', color: '#ef4444' },
}

export default function VistoriaExternaPage() {
  const params = useParams()
  const token = params.token as string

  const [vistoria, setVistoria] = useState<ExternalVistoriaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchExternalVistoria(token)
        setVistoria(data)
      } catch (err: any) {
        console.error('Error loading external vistoria:', err)
        if (err?.response?.status === 404) {
          setError('Vistoria nao encontrada ou link expirado.')
        } else {
          setError('Erro ao carregar vistoria. Tente novamente mais tarde.')
        }
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [token])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">Carregando vistoria...</Typography>
      </Box>
    )
  }

  if (error || !vistoria) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>CondoCompare</Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Vistoria nao encontrada'}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            O link pode ter sido revogado ou a vistoria nao existe mais.
          </Typography>
        </Paper>
      </Box>
    )
  }

  const itens = vistoria.itens || []
  const fotos = vistoria.fotos || []

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0', px: 3, py: 2, mb: 3 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e293b' }}>
            CondoCompare
          </Typography>
          <Chip
            icon={<ShareIcon />}
            label="Vistoria Compartilhada"
            color="info"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, pb: 4 }}>
        {/* Title */}
        <Box sx={{ mb: 3 }}>
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
                <Typography variant="caption" color="text.secondary">Nao Conformes</Typography>
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
            {vistoria.responsavelNome && (
              <Grid item xs={12} md={3}>
                <Typography variant="caption" color="text.secondary">Responsavel</Typography>
                <Typography variant="body2" fontWeight={500}>{vistoria.responsavelNome}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Checklist */}
        {totalItens > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlaylistAddCheckIcon sx={{ color: '#3b82f6' }} />
                <Typography variant="h6" fontWeight="bold">Checklist de Vistoria</Typography>
                <Chip label={`${totalItens} itens`} size="small" variant="outlined" />
              </Box>
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
            </Box>

            {Object.entries(groupedItens).map(([categoria, items]) => {
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
                        }}
                      >
                        {/* Status icon */}
                        <Box sx={{ color: STATUS_ITEM_CONFIG[item.status]?.color || '#94a3b8' }}>
                          {STATUS_ITEM_CONFIG[item.status]?.icon}
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

                        {/* Severity badge */}
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
            })}
          </Paper>
        )}

        {/* Observacoes */}
        {vistoria.observacoes && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WarningIcon sx={{ color: '#f59e0b' }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#92400e' }}>Observacoes</Typography>
            </Box>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#78350f', lineHeight: 1.7 }}>
              {vistoria.observacoes}
            </Typography>
          </Paper>
        )}

        {/* Fotos */}
        {fotos.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PhotoCameraIcon sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" fontWeight="bold">Fotos da Vistoria</Typography>
              <Chip label={fotos.length} size="small" sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 700, height: 22 }} />
            </Box>
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
                    }}
                  >
                    <Box
                      component="img"
                      src={foto.url}
                      alt={foto.descricao || 'Foto da vistoria'}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
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
          </Paper>
        )}

        {/* Laudo */}
        {vistoria.laudoTexto && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DescriptionIcon sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" fontWeight="bold">Laudo Tecnico</Typography>
            </Box>
            {vistoria.laudoGeradoEm && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Laudo gerado em {new Date(vistoria.laudoGeradoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Alert>
            )}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                fontSize: '0.85rem',
                lineHeight: 1.6,
              }}
            >
              {vistoria.laudoTexto}
            </Paper>
          </Paper>
        )}

        {/* Footer */}
        <Box sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
          <Typography variant="caption">
            Gerado por CondoCompare - Gestao Inteligente de Seguro Condominio
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
