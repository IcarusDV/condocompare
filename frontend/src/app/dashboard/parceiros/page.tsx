'use client'

import { useState, useEffect } from 'react'
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
import { useRouter } from 'next/navigation'
import { parceiroService } from '@/services/parceiroService'
import {
  ParceiroListResponse,
  CategoriaParceiro,
  CATEGORIAS_PARCEIRO,
} from '@/types'

export default function ParceirosPage() {
  const router = useRouter()
  const [parceiros, setParceiros] = useState<ParceiroListResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaParceiro | ''>('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedParceiro, setSelectedParceiro] = useState<ParceiroListResponse | null>(null)

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
    } catch (err) {
      console.error('Error loading parceiros:', err)
      setError('Erro ao carregar parceiros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParceiros()
  }, [page, categoriaFilter, estadoFilter])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 0) {
        loadParceiros()
      } else {
        setPage(0)
      }
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, parceiro: ParceiroListResponse) => {
    setAnchorEl(event.currentTarget)
    setSelectedParceiro(parceiro)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedParceiro(null)
  }

  const getCategoriaColor = (categoria: CategoriaParceiro): string => {
    const colors: Record<string, string> = {
      ELEVADORES: '#6366f1',
      JARDINAGEM: '#22c55e',
      PORTARIA: '#3b82f6',
      LIMPEZA: '#14b8a6',
      ELETRICA: '#f59e0b',
      HIDRAULICA: '#06b6d4',
      PINTURA: '#ec4899',
      ADVOCACIA: '#8b5cf6',
      CONTABILIDADE: '#64748b',
      BOMBEIRO_CIVIL: '#ef4444',
      DEDETIZACAO: '#84cc16',
      IMPERMEABILIZACAO: '#0ea5e9',
      AR_CONDICIONADO: '#06b6d4',
      PISCINA: '#3b82f6',
      GERADOR: '#f97316',
      INTERFONE: '#a855f7',
      CFTV: '#6366f1',
      INCENDIO: '#dc2626',
      GAS: '#eab308',
      SERRALHERIA: '#78716c',
      VIDRACARIA: '#22d3ee',
      TELHADO: '#92400e',
      SEGUROS: '#2563eb',
      ADMINISTRACAO: '#7c3aed',
      OUTRO: '#94a3b8',
    }
    return colors[categoria] || '#94a3b8'
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <HandymanIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold">
              Parceiros
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Prestadores de servico para condominios
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/parceiros/novo')}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
        >
          Novo Parceiro
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar parceiro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select
                value={categoriaFilter}
                label="Categoria"
                onChange={(e) => setCategoriaFilter(e.target.value as CategoriaParceiro | '')}
              >
                <MenuItem value="">Todas</MenuItem>
                {Object.entries(CATEGORIAS_PARCEIRO).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={estadoFilter}
                label="Estado"
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="SP">Sao Paulo</MenuItem>
                <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                <MenuItem value="MG">Minas Gerais</MenuItem>
                <MenuItem value="RS">Rio Grande do Sul</MenuItem>
                <MenuItem value="PR">Parana</MenuItem>
                <MenuItem value="SC">Santa Catarina</MenuItem>
                <MenuItem value="BA">Bahia</MenuItem>
                <MenuItem value="DF">Distrito Federal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => router.push('/dashboard/parceiros/buscar')}
              sx={{ height: 40 }}
            >
              Busca Avancada
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Parceiros Grid */}
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
                <Skeleton variant="text" width="50%" height={20} animation="wave" />
                <Skeleton variant="text" width="60%" height={20} animation="wave" />
                <Skeleton variant="text" width="55%" height={20} animation="wave" />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Skeleton variant="rounded" width={100} height={32} animation="wave" />
                  <Skeleton variant="rounded" width={100} height={32} animation="wave" />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : parceiros.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#eef2ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <HandymanIcon sx={{ fontSize: 40, color: '#6366f1' }} />
          </Box>
          <Typography variant="h6" gutterBottom>
            Nenhum parceiro encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {search || categoriaFilter || estadoFilter
              ? 'Tente ajustar os filtros de busca'
              : 'Cadastre seu primeiro parceiro'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/dashboard/parceiros/novo')}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
          >
            Cadastrar Parceiro
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {parceiros.map((parceiro) => (
              <Grid item xs={12} sm={6} md={4} key={parceiro.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Avatar
                          src={parceiro.logoUrl}
                          sx={{ width: 48, height: 48, bgcolor: '#6366f1' }}
                        >
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight="bold" noWrap>
                              {parceiro.nomeFantasia || parceiro.nome}
                            </Typography>
                            {parceiro.verificado && (
                              <Tooltip title="Parceiro Verificado">
                                <VerifiedIcon sx={{ fontSize: 18, color: '#22c55e' }} />
                              </Tooltip>
                            )}
                          </Box>
                          {parceiro.nomeFantasia && parceiro.nome !== parceiro.nomeFantasia && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {parceiro.nome}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, parceiro)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {parceiro.categorias.slice(0, 3).map((cat) => (
                        <Chip
                          key={cat}
                          label={CATEGORIAS_PARCEIRO[cat]}
                          size="small"
                          sx={{
                            bgcolor: `${getCategoriaColor(cat)}15`,
                            color: getCategoriaColor(cat),
                            fontWeight: 500,
                            fontSize: 11,
                          }}
                        />
                      ))}
                      {parceiro.categorias.length > 3 && (
                        <Chip
                          label={`+${parceiro.categorias.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 11 }}
                        />
                      )}
                    </Box>

                    {(parceiro.avaliacao !== undefined && parceiro.avaliacao !== null) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Rating
                          value={parceiro.avaliacao}
                          precision={0.5}
                          size="small"
                          readOnly
                        />
                        <Typography variant="body2" color="text.secondary">
                          ({parceiro.totalAvaliacoes || 0})
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {parceiro.cidade && parceiro.estado && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {parceiro.cidade}/{parceiro.estado}
                          </Typography>
                        </Box>
                      )}
                      {parceiro.telefone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {parceiro.telefone}
                          </Typography>
                        </Box>
                      )}
                      {parceiro.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {parceiro.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      onClick={() => router.push(`/dashboard/parceiros/${parceiro.id}`)}
                      sx={{ color: '#6366f1' }}
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      href={`tel:${parceiro.telefone}`}
                      sx={{ ml: 'auto', borderColor: '#6366f1', color: '#6366f1' }}
                      startIcon={<PhoneIcon />}
                    >
                      Contatar
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedParceiro) {
              router.push(`/dashboard/parceiros/${selectedParceiro.id}`)
            }
            handleMenuClose()
          }}
        >
          Ver Detalhes
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedParceiro) {
              router.push(`/dashboard/parceiros/${selectedParceiro.id}/editar`)
            }
            handleMenuClose()
          }}
        >
          Editar
        </MenuItem>
      </Menu>
    </Box>
  )
}
