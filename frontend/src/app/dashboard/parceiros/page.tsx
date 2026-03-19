'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Skeleton,
  Rating,
  Avatar,
  Tooltip,
  Pagination,
  LinearProgress,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import VerifiedIcon from '@mui/icons-material/Verified'
import BusinessIcon from '@mui/icons-material/Business'
import HandymanIcon from '@mui/icons-material/Handyman'
import FilterListIcon from '@mui/icons-material/FilterList'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import StarIcon from '@mui/icons-material/Star'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import PeopleIcon from '@mui/icons-material/People'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CategoryIcon from '@mui/icons-material/Category'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useRouter } from 'next/navigation'
import { parceiroService } from '@/services/parceiroService'
import {
  ParceiroListResponse,
  CategoriaParceiro,
  CATEGORIAS_PARCEIRO,
} from '@/types'

// ─── Category icons ──────────────────────────────────────────────────

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

// ─── Popular categories for quick filters ────────────────────────────

const POPULAR_CATEGORIES: CategoriaParceiro[] = [
  'ELETRICA', 'HIDRAULICA', 'ELEVADORES', 'LIMPEZA', 'PORTARIA',
  'JARDINAGEM', 'PINTURA', 'INCENDIO', 'CFTV', 'ADVOCACIA',
]

type ViewMode = 'grid' | 'list'

// ═════════════════════════════════════════════════════════════════════

export default function ParceirosPage() {
  const router = useRouter()

  // Data state
  const [parceiros, setParceiros] = useState<ParceiroListResponse[]>([])
  const [topRated, setTopRated] = useState<ParceiroListResponse[]>([])
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadingTop, setLoadingTop] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaParceiro | ''>('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // UI
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedParceiro, setSelectedParceiro] = useState<ParceiroListResponse | null>(null)

  // ─── Load data ─────────────────────────────────────────────────

  const loadParceiros = async () => {
    try {
      setLoading(true)
      const response = await parceiroService.list(
        {
          search: search || undefined,
          categoria: categoriaFilter || undefined,
          estado: estadoFilter || undefined,
          ativo: true,
        },
        { page, size: 12 }
      )
      setParceiros(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (err) {
      console.error('Error loading parceiros:', err)
      setError('Erro ao carregar parceiros')
    } finally {
      setLoading(false)
    }
  }

  // Load top rated + category stats on mount
  useEffect(() => {
    const loadExtras = async () => {
      try {
        setLoadingTop(true)
        const [top, stats] = await Promise.all([
          parceiroService.findTopRated(5).catch(() => []),
          parceiroService.countByCategoria().catch(() => ({})),
        ])
        setTopRated(top)
        setCategoryStats(stats as Record<string, number>)
      } catch { /* ignore */ }
      finally { setLoadingTop(false) }
    }
    loadExtras()
  }, [])

  useEffect(() => {
    loadParceiros()
  }, [page, categoriaFilter, estadoFilter])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 0) loadParceiros()
      else setPage(0)
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  // ─── Handlers ──────────────────────────────────────────────────

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, parceiro: ParceiroListResponse) => {
    setAnchorEl(event.currentTarget)
    setSelectedParceiro(parceiro)
  }
  const handleMenuClose = () => { setAnchorEl(null); setSelectedParceiro(null) }

  const handleQuickFilter = (cat: CategoriaParceiro) => {
    setCategoriaFilter(prev => prev === cat ? '' : cat)
    setPage(0)
  }

  const handleWhatsApp = (celular?: string, telefone?: string) => {
    const num = (celular || telefone || '').replace(/\D/g, '')
    if (num) window.open(`https://wa.me/55${num}`, '_blank')
  }

  // ─── KPI data ──────────────────────────────────────────────────

  const totalParceiros = totalElements
  const totalVerificados = parceiros.filter(p => p.verificado).length
  const avgRating = parceiros.length > 0
    ? parceiros.filter(p => p.avaliacao).reduce((sum, p) => sum + (p.avaliacao || 0), 0) / parceiros.filter(p => p.avaliacao).length
    : 0
  const activeCategorias = Object.values(categoryStats).filter(v => v > 0).length

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <Box>
      {/* ─── Header ─────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        mb: 3, p: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white',
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <HandymanIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold">Parceiros</Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Prestadores de servico para condominios
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<FilterListIcon />}
            onClick={() => router.push('/dashboard/parceiros/buscar')}
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            Busca Inteligente
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => router.push('/dashboard/parceiros/novo')}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
            Novo Parceiro
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ─── KPI Cards (1) ──────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { icon: <PeopleIcon />, label: 'Total Parceiros', value: totalParceiros, color: '#6366f1' },
          { icon: <CheckCircleIcon />, label: 'Verificados', value: totalVerificados, color: '#22c55e' },
          { icon: <CategoryIcon />, label: 'Categorias Ativas', value: activeCategorias, color: '#f59e0b' },
          { icon: <StarIcon />, label: 'Avaliacao Media', value: avgRating > 0 ? avgRating.toFixed(1) : '-', color: '#ec4899' },
        ].map((kpi) => (
          <Grid item xs={6} md={3} key={kpi.label}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: `${kpi.color}12`, color: kpi.color,
              }}>
                {kpi.icon}
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" lineHeight={1}>{kpi.value}</Typography>
                <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ─── Top Rated Carousel (9) ─────────────────────────── */}
      {!loadingTop && topRated.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <StarIcon sx={{ color: '#f59e0b', fontSize: 22 }} />
            <Typography variant="subtitle1" fontWeight="bold">Parceiros em Destaque</Typography>
            <Chip label="Top Rated" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: '0.65rem' }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, overflow: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: 2 } }}>
            {topRated.map((p) => (
              <Card key={p.id} sx={{
                minWidth: 220, maxWidth: 220, cursor: 'pointer', border: '1px solid #e2e8f0', boxShadow: 'none',
                '&:hover': { borderColor: '#6366f1', transform: 'translateY(-2px)' }, transition: 'all 0.2s',
              }} onClick={() => router.push(`/dashboard/parceiros/${p.id}`)}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar src={p.logoUrl} sx={{ width: 36, height: 36, bgcolor: '#6366f1', fontSize: '0.8rem' }}>
                      {(p.nomeFantasia || p.nome).charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{p.nomeFantasia || p.nome}</Typography>
                        {p.verificado && <VerifiedIcon sx={{ fontSize: 14, color: '#22c55e' }} />}
                      </Box>
                      {p.cidade && <Typography variant="caption" color="text.secondary">{p.cidade}/{p.estado}</Typography>}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating value={p.avaliacao || 0} precision={0.5} size="small" readOnly />
                    <Typography variant="caption" color="text.secondary">({p.totalAvaliacoes || 0})</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                    {p.categorias.slice(0, 2).map(cat => (
                      <Chip key={cat} label={CATEGORIAS_PARCEIRO[cat]} size="small"
                        sx={{ height: 20, fontSize: '0.6rem', bgcolor: `${getCategoriaColor(cat)}12`, color: getCategoriaColor(cat) }} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* ─── Quick Category Filters (2, 7, 8) ──────────────── */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <CategoryIcon sx={{ fontSize: 18, color: '#64748b' }} />
          <Typography variant="body2" fontWeight={600} color="text.secondary">Categorias</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {POPULAR_CATEGORIES.map((cat) => {
            const isActive = categoriaFilter === cat
            const color = getCategoriaColor(cat)
            const count = categoryStats[cat] || 0
            return (
              <Chip
                key={cat}
                icon={getCategoriaIcon(cat, 16) as React.ReactElement}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {CATEGORIAS_PARCEIRO[cat]?.split(' ')[0]}
                    {count > 0 && (
                      <Box component="span" sx={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 18, height: 18, borderRadius: '50%', bgcolor: isActive ? 'rgba(255,255,255,0.3)' : `${color}20`,
                        fontSize: '0.6rem', fontWeight: 700,
                      }}>
                        {count}
                      </Box>
                    )}
                  </Box>
                }
                onClick={() => handleQuickFilter(cat)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: isActive ? color : `${color}08`,
                  color: isActive ? 'white' : color,
                  border: `1px solid ${isActive ? color : `${color}30`}`,
                  fontWeight: 600, fontSize: '0.75rem',
                  '&:hover': { bgcolor: isActive ? color : `${color}15` },
                  '& .MuiChip-icon': { color: isActive ? 'white' : color },
                }}
              />
            )
          })}
          {categoriaFilter && !POPULAR_CATEGORIES.includes(categoriaFilter) && (
            <Chip
              label={CATEGORIAS_PARCEIRO[categoriaFilter]}
              onDelete={() => setCategoriaFilter('')}
              sx={{ bgcolor: `${getCategoriaColor(categoriaFilter)}15`, color: getCategoriaColor(categoriaFilter), fontWeight: 600 }}
            />
          )}
        </Box>
      </Paper>

      {/* ─── Filters & View Toggle ──────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" placeholder="Buscar parceiro..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select value={categoriaFilter} label="Categoria"
                onChange={(e) => { setCategoriaFilter(e.target.value as CategoriaParceiro | ''); setPage(0) }}>
                <MenuItem value="">Todas</MenuItem>
                {Object.entries(CATEGORIAS_PARCEIRO).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getCategoriaIcon(key as CategoriaParceiro, 16)}
                      {label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={estadoFilter} label="Estado" onChange={(e) => { setEstadoFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">Todos</MenuItem>
                {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'DF', 'GO', 'PE', 'CE', 'ES'].map(uf => (
                  <MenuItem key={uf} value={uf}>{uf}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Typography variant="caption" color="text.secondary">
                {loading ? '...' : `${totalElements} parceiro(s)`}
              </Typography>
              <ToggleButtonGroup value={viewMode} exclusive size="small"
                onChange={(_, v) => { if (v) setViewMode(v) }}>
                <ToggleButton value="grid"><ViewModuleIcon sx={{ fontSize: 18 }} /></ToggleButton>
                <ToggleButton value="list"><ViewListIcon sx={{ fontSize: 18 }} /></ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ─── Content ────────────────────────────────────────── */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={48} height={48} animation="wave" />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height={24} animation="wave" />
                    <Skeleton variant="text" width="40%" height={18} animation="wave" />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                  <Skeleton variant="rounded" width={80} height={24} animation="wave" />
                  <Skeleton variant="rounded" width={80} height={24} animation="wave" />
                </Box>
                <Skeleton variant="text" width="60%" height={20} animation="wave" />
                <Skeleton variant="text" width="55%" height={20} animation="wave" />
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : parceiros.length === 0 ? (
        /* ─── Empty State (6) ─────────────────────────────── */
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <HandymanIcon sx={{ fontSize: 40, color: '#6366f1' }} />
          </Box>
          {search || categoriaFilter || estadoFilter ? (
            <>
              <Typography variant="h6" gutterBottom>Nenhum parceiro encontrado</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Tente ajustar os filtros de busca</Typography>
              <Button variant="outlined" onClick={() => { setSearch(''); setCategoriaFilter(''); setEstadoFilter('') }}
                sx={{ textTransform: 'none', mr: 1 }}>
                Limpar Filtros
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>Comece a construir sua rede de parceiros</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                Cadastre prestadores de servico para facilitar a gestao do condominio. Com o matching inteligente, encontre o parceiro ideal baseado nas caracteristicas do seu condominio.
              </Typography>
              <Grid container spacing={2} sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                {[
                  { icon: <TrendingUpIcon />, text: 'Matching inteligente' },
                  { icon: <StarIcon />, text: 'Avaliacao e rating' },
                  { icon: <CheckCircleIcon />, text: 'Parceiros verificados' },
                ].map((item, i) => (
                  <Grid item xs={4} key={i}>
                    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Box sx={{ color: '#6366f1', mb: 0.5 }}>{item.icon}</Box>
                      <Typography variant="caption" fontWeight={600}>{item.text}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button variant="contained" startIcon={<AddIcon />}
                  onClick={() => router.push('/dashboard/parceiros/novo')}
                  sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                  Cadastrar Parceiro
                </Button>
                <Button variant="outlined" startIcon={<FilterListIcon />}
                  onClick={() => router.push('/dashboard/parceiros/buscar')}
                  sx={{ borderColor: '#6366f1', color: '#6366f1' }}>
                  Busca Inteligente
                </Button>
              </Box>
            </>
          )}
        </Paper>
      ) : viewMode === 'grid' ? (
        /* ─── Grid View (3) ───────────────────────────────── */
        <>
          <Grid container spacing={3}>
            {parceiros.map((parceiro) => (
              <Grid item xs={12} sm={6} md={4} key={parceiro.id}>
                <Card sx={{
                  height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2,
                  border: '1px solid #e2e8f0', boxShadow: 'none',
                  transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transform: 'translateY(-2px)', borderColor: '#6366f1' },
                }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <Avatar src={parceiro.logoUrl} sx={{ width: 52, height: 52, bgcolor: '#6366f1', fontSize: '1.1rem', fontWeight: 700 }}>
                          {(parceiro.nomeFantasia || parceiro.nome).charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight="bold" noWrap>
                              {parceiro.nomeFantasia || parceiro.nome}
                            </Typography>
                            {parceiro.verificado && (
                              <Tooltip title="Parceiro Verificado">
                                <Box sx={{
                                  display: 'flex', alignItems: 'center', gap: 0.3, px: 0.8, py: 0.2, borderRadius: 1,
                                  bgcolor: '#f0fdf4', border: '1px solid #bbf7d0',
                                }}>
                                  <VerifiedIcon sx={{ fontSize: 14, color: '#22c55e' }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#16a34a' }}>Verificado</Typography>
                                </Box>
                              </Tooltip>
                            )}
                          </Box>
                          {parceiro.nomeFantasia && parceiro.nome !== parceiro.nomeFantasia && (
                            <Typography variant="caption" color="text.secondary" noWrap>{parceiro.nome}</Typography>
                          )}
                        </Box>
                      </Box>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, parceiro)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    {/* Categories with icons */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {parceiro.categorias.slice(0, 3).map((cat) => (
                        <Chip key={cat}
                          icon={getCategoriaIcon(cat, 14) as React.ReactElement}
                          label={CATEGORIAS_PARCEIRO[cat]?.split(' ')[0] || cat}
                          size="small"
                          sx={{
                            bgcolor: `${getCategoriaColor(cat)}10`, color: getCategoriaColor(cat),
                            fontWeight: 500, fontSize: '0.7rem',
                            '& .MuiChip-icon': { color: getCategoriaColor(cat) },
                          }}
                        />
                      ))}
                      {parceiro.categorias.length > 3 && (
                        <Chip label={`+${parceiro.categorias.length - 3}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      )}
                    </Box>

                    {/* Rating - bigger */}
                    {(parceiro.avaliacao !== undefined && parceiro.avaliacao !== null) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1, bgcolor: '#fffbeb', borderRadius: 1 }}>
                        <Rating value={parceiro.avaliacao} precision={0.5} size="medium" readOnly />
                        <Typography variant="body2" fontWeight={700} color="#92400e">{parceiro.avaliacao.toFixed(1)}</Typography>
                        <Typography variant="caption" color="text.secondary">({parceiro.totalAvaliacoes || 0})</Typography>
                      </Box>
                    )}

                    {/* Contact info */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {parceiro.cidade && parceiro.estado && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 16, color: '#64748b' }} />
                          <Typography variant="body2" color="text.secondary">{parceiro.cidade}/{parceiro.estado}</Typography>
                        </Box>
                      )}
                      {parceiro.telefone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: '#64748b' }} />
                          <Typography variant="body2" color="text.secondary">{parceiro.telefone}</Typography>
                        </Box>
                      )}
                      {parceiro.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 16, color: '#64748b' }} />
                          <Typography variant="body2" color="text.secondary" noWrap>{parceiro.email}</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, gap: 0.5 }}>
                    <Button size="small" onClick={() => router.push(`/dashboard/parceiros/${parceiro.id}`)}
                      sx={{ color: '#6366f1', textTransform: 'none' }} endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}>
                      Ver Detalhes
                    </Button>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                      <Tooltip title="WhatsApp">
                        <IconButton size="small" onClick={() => handleWhatsApp(undefined, parceiro.telefone)}
                          sx={{ color: '#25d366', border: '1px solid #25d36630', '&:hover': { bgcolor: '#25d36610' } }}>
                          <WhatsAppIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Button size="small" variant="outlined" href={`tel:${parceiro.telefone}`}
                        sx={{ borderColor: '#6366f1', color: '#6366f1', textTransform: 'none', minWidth: 0, px: 1 }}
                        startIcon={<PhoneIcon sx={{ fontSize: 16 }} />}>
                        Ligar
                      </Button>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={totalPages} page={page + 1} onChange={(_, value) => setPage(value - 1)} color="primary" />
            </Box>
          )}
        </>
      ) : (
        /* ─── List View (4) ───────────────────────────────── */
        <Paper sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Parceiro', 'Categorias', 'Avaliacao', 'Cidade/UF', 'Contato', 'Acoes'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, bgcolor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {parceiros.map((p) => (
                  <TableRow key={p.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}
                    onClick={() => router.push(`/dashboard/parceiros/${p.id}`)}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={p.logoUrl} sx={{ width: 36, height: 36, bgcolor: '#6366f1', fontSize: '0.8rem' }}>
                          {(p.nomeFantasia || p.nome).charAt(0)}
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>{p.nomeFantasia || p.nome}</Typography>
                            {p.verificado && <VerifiedIcon sx={{ fontSize: 14, color: '#22c55e' }} />}
                          </Box>
                          {p.nomeFantasia && p.nome !== p.nomeFantasia && (
                            <Typography variant="caption" color="text.secondary">{p.nome}</Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {p.categorias.slice(0, 2).map(cat => (
                          <Chip key={cat} label={CATEGORIAS_PARCEIRO[cat]?.split(' ')[0]} size="small"
                            sx={{ height: 22, fontSize: '0.65rem', bgcolor: `${getCategoriaColor(cat)}10`, color: getCategoriaColor(cat) }} />
                        ))}
                        {p.categorias.length > 2 && <Chip label={`+${p.categorias.length - 2}`} size="small" sx={{ height: 22, fontSize: '0.65rem' }} />}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {p.avaliacao ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                          <Typography variant="body2" fontWeight={700}>{p.avaliacao.toFixed(1)}</Typography>
                          <Typography variant="caption" color="text.secondary">({p.totalAvaliacoes})</Typography>
                        </Box>
                      ) : <Typography variant="caption" color="text.secondary">-</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{p.cidade && p.estado ? `${p.cidade}/${p.estado}` : '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{p.telefone || p.email || '-'}</Typography>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="WhatsApp">
                          <IconButton size="small" onClick={() => handleWhatsApp(undefined, p.telefone)} sx={{ color: '#25d366' }}>
                            <WhatsAppIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ligar">
                          <IconButton size="small" href={`tel:${p.telefone}`} sx={{ color: '#6366f1' }}>
                            <PhoneIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #e2e8f0' }}>
              <Pagination count={totalPages} page={page + 1} onChange={(_, value) => setPage(value - 1)} color="primary" size="small" />
            </Box>
          )}
        </Paper>
      )}

      {/* ─── Menu ───────────────────────────────────────────── */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { if (selectedParceiro) router.push(`/dashboard/parceiros/${selectedParceiro.id}`); handleMenuClose() }}>
          Ver Detalhes
        </MenuItem>
        <MenuItem onClick={() => { if (selectedParceiro) router.push(`/dashboard/parceiros/${selectedParceiro.id}/editar`); handleMenuClose() }}>
          Editar
        </MenuItem>
      </Menu>
    </Box>
  )
}
