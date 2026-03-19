'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Skeleton,
  Rating,
  Avatar,
  Tooltip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import VerifiedIcon from '@mui/icons-material/Verified'
import BusinessIcon from '@mui/icons-material/Business'
import LanguageIcon from '@mui/icons-material/Language'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import PersonIcon from '@mui/icons-material/Person'
import BadgeIcon from '@mui/icons-material/Badge'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import HandymanIcon from '@mui/icons-material/Handyman'
import DescriptionIcon from '@mui/icons-material/Description'
import MapIcon from '@mui/icons-material/Map'
import NotesIcon from '@mui/icons-material/Notes'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import StarIcon from '@mui/icons-material/Star'
import ElevatorIcon from '@mui/icons-material/Elevator'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'
import YardIcon from '@mui/icons-material/Yard'
import SecurityIcon from '@mui/icons-material/Security'
import ColorLensIcon from '@mui/icons-material/ColorLens'
import GavelIcon from '@mui/icons-material/Gavel'
import CalculateIcon from '@mui/icons-material/Calculate'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import PoolIcon from '@mui/icons-material/Pool'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import VideocamIcon from '@mui/icons-material/Videocam'
import PestControlIcon from '@mui/icons-material/PestControl'
import RoofingIcon from '@mui/icons-material/Roofing'
import WindowIcon from '@mui/icons-material/Window'
import GroupsIcon from '@mui/icons-material/Groups'
import ShieldIcon from '@mui/icons-material/Shield'
import BuildIcon from '@mui/icons-material/Build'
import { parceiroService } from '@/services/parceiroService'
import {
  ParceiroResponse,
  CategoriaParceiro,
  CATEGORIAS_PARCEIRO,
} from '@/types'

// ─── Category helpers ──────────────────────────────────────────

const getCategoriaIcon = (cat: CategoriaParceiro, size = 20): React.ReactNode => {
  const sx = { fontSize: size }
  const icons: Partial<Record<CategoriaParceiro, React.ReactNode>> = {
    ELEVADORES: <ElevatorIcon sx={sx} />,
    JARDINAGEM: <YardIcon sx={sx} />,
    PORTARIA: <SecurityIcon sx={sx} />,
    LIMPEZA: <CleaningServicesIcon sx={sx} />,
    ELETRICA: <ElectricalServicesIcon sx={sx} />,
    HIDRAULICA: <WaterDropIcon sx={sx} />,
    PINTURA: <ColorLensIcon sx={sx} />,
    ADVOCACIA: <GavelIcon sx={sx} />,
    CONTABILIDADE: <CalculateIcon sx={sx} />,
    BOMBEIRO_CIVIL: <LocalFireDepartmentIcon sx={sx} />,
    DEDETIZACAO: <PestControlIcon sx={sx} />,
    AR_CONDICIONADO: <AcUnitIcon sx={sx} />,
    PISCINA: <PoolIcon sx={sx} />,
    CFTV: <VideocamIcon sx={sx} />,
    INCENDIO: <LocalFireDepartmentIcon sx={sx} />,
    TELHADO: <RoofingIcon sx={sx} />,
    VIDRACARIA: <WindowIcon sx={sx} />,
    SEGUROS: <ShieldIcon sx={sx} />,
    ADMINISTRACAO: <GroupsIcon sx={sx} />,
  }
  return icons[cat] || <BuildIcon sx={sx} />
}

const getCategoriaColor = (categoria: CategoriaParceiro): string => {
  const colors: Record<string, string> = {
    ELEVADORES: '#6366f1', JARDINAGEM: '#22c55e', PORTARIA: '#3b82f6',
    LIMPEZA: '#14b8a6', ELETRICA: '#f59e0b', HIDRAULICA: '#06b6d4',
    PINTURA: '#ec4899', ADVOCACIA: '#8b5cf6', CONTABILIDADE: '#64748b',
    BOMBEIRO_CIVIL: '#ef4444', DEDETIZACAO: '#84cc16', IMPERMEABILIZACAO: '#0ea5e9',
    AR_CONDICIONADO: '#06b6d4', PISCINA: '#3b82f6', GERADOR: '#f97316',
    INTERFONE: '#a855f7', CFTV: '#6366f1', INCENDIO: '#dc2626',
    GAS: '#eab308', SERRALHERIA: '#78716c', VIDRACARIA: '#22d3ee',
    TELHADO: '#92400e', SEGUROS: '#2563eb', ADMINISTRACAO: '#7c3aed', OUTRO: '#94a3b8',
  }
  return colors[categoria] || '#94a3b8'
}

// ═══════════════════════════════════════════════════════════════

export default function ParceiroDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [parceiro, setParceiro] = useState<ParceiroResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [snackMessage, setSnackMessage] = useState<string | null>(null)

  const loadParceiro = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await parceiroService.getById(id)
      setParceiro(data)
    } catch (err) {
      console.error('Error loading parceiro:', err)
      setError('Erro ao carregar detalhes do parceiro')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadParceiro()
  }, [loadParceiro])

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await parceiroService.delete(id)
      router.push('/dashboard/parceiros')
    } catch (err) {
      console.error('Error deleting parceiro:', err)
      setError('Erro ao excluir parceiro')
      setDeleteDialogOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleAtivo = async () => {
    if (!parceiro) return
    try {
      setActionLoading(true)
      if (parceiro.ativo) {
        await parceiroService.deactivate(id)
      } else {
        await parceiroService.activate(id)
      }
      await loadParceiro()
    } catch (err) {
      console.error('Error toggling ativo:', err)
      setError('Erro ao alterar status do parceiro')
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerificar = async () => {
    if (!parceiro || parceiro.verificado) return
    try {
      setActionLoading(true)
      await parceiroService.verify(id)
      await loadParceiro()
    } catch (err) {
      console.error('Error verifying parceiro:', err)
      setError('Erro ao verificar parceiro')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setSnackMessage(`${label} copiado!`)
    setTimeout(() => setSnackMessage(null), 2000)
  }

  const handleWhatsApp = (num?: string) => {
    const clean = (num || '').replace(/\D/g, '')
    if (clean) window.open(`https://wa.me/55${clean}`, '_blank')
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // ─── Loading skeleton ──────────────────────────────────────

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Skeleton variant="rounded" width={80} height={36} />
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={350} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={350} />
          </Grid>
        </Grid>
      </Box>
    )
  }

  if (error && !parceiro) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard/parceiros')} sx={{ mb: 2 }}>
          Voltar
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!parceiro) return null

  const enderecoFormatado = [
    parceiro.endereco?.endereco,
    parceiro.endereco?.numero && `n° ${parceiro.endereco.numero}`,
    parceiro.endereco?.complemento,
  ].filter(Boolean).join(', ')

  const enderecoCompleto = [
    enderecoFormatado,
    parceiro.endereco?.bairro,
    parceiro.endereco?.cidade && parceiro.endereco?.estado
      ? `${parceiro.endereco.cidade}/${parceiro.endereco.estado}`
      : parceiro.endereco?.cidade || parceiro.endereco?.estado,
    parceiro.endereco?.cep && `CEP: ${parceiro.endereco.cep}`,
  ].filter(Boolean).join(' - ')

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <Box>
      {/* ─── Snack message ──────────────────────────────── */}
      {snackMessage && (
        <Alert severity="success" sx={{ position: 'fixed', top: 80, right: 24, zIndex: 1000, boxShadow: 4 }}
          onClose={() => setSnackMessage(null)}>
          {snackMessage}
        </Alert>
      )}

      {/* ─── Header ─────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        mb: 3, p: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard/parceiros')}
            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            Voltar
          </Button>
          <Avatar
            src={parceiro.logoUrl}
            sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '1.4rem', fontWeight: 700 }}
          >
            {(parceiro.nomeFantasia || parceiro.nome).charAt(0)}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                {parceiro.nomeFantasia || parceiro.nome}
              </Typography>
              {parceiro.verificado && (
                <Chip
                  icon={<VerifiedIcon sx={{ color: '#22c55e !important', fontSize: 16 }} />}
                  label="Verificado"
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                />
              )}
              {!parceiro.ativo && (
                <Chip label="Inativo" size="small"
                  sx={{ bgcolor: 'rgba(239,68,68,0.3)', color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />
              )}
            </Box>
            {parceiro.nomeFantasia && parceiro.nome !== parceiro.nomeFantasia && (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>{parceiro.nome}</Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<EditIcon />}
            onClick={() => router.push(`/dashboard/parceiros/${id}/editar`)}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
            Editar
          </Button>
          <Button variant="contained" startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            sx={{ bgcolor: 'rgba(239,68,68,0.3)', '&:hover': { bgcolor: 'rgba(239,68,68,0.5)' } }}>
            Excluir
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* ─── Left column: Identity & Actions ────────── */}
        <Grid item xs={12} md={4}>
          {/* Status & Actions */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
              Status e Acoes
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Ativo/Inativo */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {parceiro.ativo ? (
                    <CheckCircleIcon sx={{ fontSize: 20, color: '#22c55e' }} />
                  ) : (
                    <BlockIcon sx={{ fontSize: 20, color: '#ef4444' }} />
                  )}
                  <Typography variant="body2" fontWeight={600}>
                    {parceiro.ativo ? 'Ativo' : 'Inativo'}
                  </Typography>
                </Box>
                <Button size="small" variant="outlined" onClick={handleToggleAtivo} disabled={actionLoading}
                  sx={{
                    textTransform: 'none', fontSize: '0.75rem',
                    borderColor: parceiro.ativo ? '#ef4444' : '#22c55e',
                    color: parceiro.ativo ? '#ef4444' : '#22c55e',
                    '&:hover': { bgcolor: parceiro.ativo ? '#fef2f2' : '#f0fdf4' },
                  }}>
                  {parceiro.ativo ? 'Desativar' : 'Ativar'}
                </Button>
              </Box>

              {/* Verificado */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon sx={{ fontSize: 20, color: parceiro.verificado ? '#22c55e' : '#94a3b8' }} />
                  <Typography variant="body2" fontWeight={600}>
                    {parceiro.verificado ? 'Verificado' : 'Nao verificado'}
                  </Typography>
                </Box>
                {!parceiro.verificado && (
                  <Button size="small" variant="outlined" onClick={handleVerificar} disabled={actionLoading}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', borderColor: '#6366f1', color: '#6366f1' }}>
                    Verificar
                  </Button>
                )}
              </Box>

              <Divider sx={{ my: 0.5 }} />

              {/* Rating */}
              <Box>
                <Typography variant="caption" color="text.secondary">Avaliacao</Typography>
                {parceiro.avaliacao !== undefined && parceiro.avaliacao !== null ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      px: 1.5, py: 0.5, bgcolor: '#fffbeb', borderRadius: 1, border: '1px solid #fef3c7',
                    }}>
                      <StarIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
                      <Typography variant="h6" fontWeight={700} color="#92400e">{parceiro.avaliacao.toFixed(1)}</Typography>
                    </Box>
                    <Rating value={parceiro.avaliacao} precision={0.5} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary">({parceiro.totalAvaliacoes || 0})</Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">Sem avaliacao</Typography>
                )}
              </Box>

              <Divider sx={{ my: 0.5 }} />

              {/* Timestamps */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                  <Typography variant="caption" color="text.secondary">
                    Cadastrado em {formatDate(parceiro.createdAt)}
                  </Typography>
                </Box>
                {parceiro.updatedAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                    <Typography variant="caption" color="text.secondary">
                      Atualizado em {formatDate(parceiro.updatedAt)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Quick Contact */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
              Contato Rapido
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {parceiro.celular && (
                <Button fullWidth variant="contained" startIcon={<WhatsAppIcon />}
                  onClick={() => handleWhatsApp(parceiro.celular)}
                  sx={{ bgcolor: '#25d366', '&:hover': { bgcolor: '#1fb855' }, textTransform: 'none', justifyContent: 'flex-start' }}>
                  WhatsApp: {parceiro.celular}
                </Button>
              )}
              {parceiro.telefone && (
                <Button fullWidth variant="outlined" startIcon={<PhoneIcon />}
                  href={`tel:${parceiro.telefone}`}
                  sx={{ borderColor: '#6366f1', color: '#6366f1', textTransform: 'none', justifyContent: 'flex-start' }}>
                  Ligar: {parceiro.telefone}
                </Button>
              )}
              {parceiro.email && (
                <Button fullWidth variant="outlined" startIcon={<EmailIcon />}
                  href={`mailto:${parceiro.email}`}
                  sx={{ borderColor: '#64748b', color: '#64748b', textTransform: 'none', justifyContent: 'flex-start' }}>
                  {parceiro.email}
                </Button>
              )}
              {parceiro.website && (
                <Button fullWidth variant="outlined" startIcon={<LanguageIcon />}
                  href={parceiro.website.startsWith('http') ? parceiro.website : `https://${parceiro.website}`}
                  target="_blank" rel="noopener noreferrer"
                  sx={{ borderColor: '#64748b', color: '#64748b', textTransform: 'none', justifyContent: 'flex-start' }}>
                  Website
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ─── Right column: Details ──────────────────── */}
        <Grid item xs={12} md={8}>
          {/* Categorias */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <HandymanIcon sx={{ color: '#6366f1' }} />
              <Typography variant="h6" fontWeight={700}>Categorias de Servico</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {parceiro.categorias.map((cat) => {
                const color = getCategoriaColor(cat)
                return (
                  <Chip
                    key={cat}
                    icon={getCategoriaIcon(cat, 18) as React.ReactElement}
                    label={CATEGORIAS_PARCEIRO[cat] || cat}
                    sx={{
                      bgcolor: `${color}12`, color, fontWeight: 600,
                      border: `1px solid ${color}30`,
                      '& .MuiChip-icon': { color },
                    }}
                  />
                )
              })}
              {parceiro.categorias.length === 0 && (
                <Typography variant="body2" color="text.secondary">Nenhuma categoria cadastrada</Typography>
              )}
            </Box>

            {/* Descricao dos servicos */}
            {parceiro.descricaoServicos && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DescriptionIcon sx={{ fontSize: 18, color: '#64748b' }} />
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Descricao dos Servicos</Typography>
                </Box>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: 1.8 }}>
                  {parceiro.descricaoServicos}
                </Typography>
              </Box>
            )}

            {/* Area de atuacao */}
            {parceiro.areaAtuacao && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MapIcon sx={{ fontSize: 18, color: '#64748b' }} />
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Area de Atuacao</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">{parceiro.areaAtuacao}</Typography>
              </Box>
            )}
          </Paper>

          {/* Dados Cadastrais */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BusinessIcon sx={{ color: '#6366f1' }} />
              <Typography variant="h6" fontWeight={700}>Dados Cadastrais</Typography>
            </Box>
            <Grid container spacing={2}>
              {[
                { label: 'Razao Social', value: parceiro.nome, icon: <BusinessIcon sx={{ fontSize: 16 }} /> },
                { label: 'Nome Fantasia', value: parceiro.nomeFantasia, icon: <BusinessIcon sx={{ fontSize: 16 }} /> },
                { label: 'CNPJ', value: parceiro.cnpj, icon: <BadgeIcon sx={{ fontSize: 16 }} />, copyable: true },
                { label: 'CPF', value: parceiro.cpf, icon: <BadgeIcon sx={{ fontSize: 16 }} />, copyable: true },
                { label: 'Email', value: parceiro.email, icon: <EmailIcon sx={{ fontSize: 16 }} />, copyable: true },
                { label: 'Telefone', value: parceiro.telefone, icon: <PhoneIcon sx={{ fontSize: 16 }} />, copyable: true },
                { label: 'Celular', value: parceiro.celular, icon: <PhoneIcon sx={{ fontSize: 16 }} />, copyable: true },
                { label: 'Website', value: parceiro.website, icon: <LanguageIcon sx={{ fontSize: 16 }} /> },
              ].filter(item => item.value).map((item) => (
                <Grid item xs={12} sm={6} key={item.label}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: '#94a3b8' }}>{item.icon}</Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>{item.value}</Typography>
                        {item.copyable && (
                          <Tooltip title="Copiar">
                            <IconButton size="small" onClick={() => handleCopy(item.value!, item.label)}>
                              <ContentCopyIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Endereco */}
          {enderecoCompleto && (
            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationOnIcon sx={{ color: '#6366f1' }} />
                <Typography variant="h6" fontWeight={700}>Endereco</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.8 }}>
                {enderecoCompleto}
              </Typography>
            </Paper>
          )}

          {/* Contato Responsavel */}
          {(parceiro.contatoNome || parceiro.contatoCargo) && (
            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon sx={{ color: '#6366f1' }} />
                <Typography variant="h6" fontWeight={700}>Contato Responsavel</Typography>
              </Box>
              <Grid container spacing={2}>
                {parceiro.contatoNome && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Nome</Typography>
                    <Typography variant="body2" fontWeight={500}>{parceiro.contatoNome}</Typography>
                  </Grid>
                )}
                {parceiro.contatoCargo && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Cargo</Typography>
                    <Typography variant="body2" fontWeight={500}>{parceiro.contatoCargo}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Observacoes */}
          {parceiro.observacoes && (
            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <NotesIcon sx={{ color: '#6366f1' }} />
                <Typography variant="h6" fontWeight={700}>Observacoes</Typography>
              </Box>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: 1.8 }}>
                {parceiro.observacoes}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* ─── Delete Dialog ────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Excluir Parceiro</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o parceiro <strong>{parceiro.nomeFantasia || parceiro.nome}</strong>?
            Esta acao nao pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
