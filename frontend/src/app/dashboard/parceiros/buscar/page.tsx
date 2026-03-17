'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  Rating,
  Avatar,
  Tooltip,
  Divider,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchIcon from '@mui/icons-material/Search'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import VerifiedIcon from '@mui/icons-material/Verified'
import BusinessIcon from '@mui/icons-material/Business'
import ApartmentIcon from '@mui/icons-material/Apartment'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ElevatorIcon from '@mui/icons-material/Elevator'
import PoolIcon from '@mui/icons-material/Pool'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import SecurityIcon from '@mui/icons-material/Security'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import { parceiroService } from '@/services/parceiroService'
import { condominioService } from '@/services/condominioService'
import {
  ParceiroListResponse,
  CondominioListResponse,
  CondominioResponse,
  CategoriaParceiro,
  CATEGORIAS_PARCEIRO,
} from '@/types'

export default function BuscarParceirosPage() {
  const router = useRouter()
  const [condominios, setCondominios] = useState<CondominioListResponse[]>([])
  const [selectedCondominio, setSelectedCondominio] = useState<string>('')
  const [condominioDetails, setCondominioDetails] = useState<CondominioResponse | null>(null)
  const [suggestedCategories, setSuggestedCategories] = useState<CategoriaParceiro[]>([])
  const [parceiros, setParceiros] = useState<ParceiroListResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCondominios, setLoadingCondominios] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const loadCondominios = async () => {
      try {
        const response = await condominioService.list({}, { size: 100 })
        setCondominios(response.content)
      } catch (err) {
        console.error('Error loading condominios:', err)
      } finally {
        setLoadingCondominios(false)
      }
    }
    loadCondominios()
  }, [])

  useEffect(() => {
    if (!selectedCondominio) {
      setCondominioDetails(null)
      setSuggestedCategories([])
      return
    }

    const loadDetails = async () => {
      try {
        const details = await condominioService.getById(selectedCondominio)
        setCondominioDetails(details)

        // Suggest categories based on condominio characteristics
        const suggestions: CategoriaParceiro[] = []

        // Always suggest basic maintenance
        suggestions.push('ELETRICA', 'HIDRAULICA', 'LIMPEZA')

        // Based on amenities
        if (details.caracteristicas?.numeroElevadores && details.caracteristicas.numeroElevadores > 0) {
          suggestions.push('ELEVADORES')
        }
        if (details.amenidades?.temPiscina) {
          suggestions.push('PISCINA')
        }
        if (details.amenidades?.temAcademia) {
          // Maintenance equipment
        }
        if (details.amenidades?.temPortaria24h) {
          suggestions.push('PORTARIA')
        }

        // Security and fire
        suggestions.push('CFTV', 'INCENDIO')

        // Gardens if residential
        if (details.caracteristicas?.tipoConstrucao === 'RESIDENCIAL') {
          suggestions.push('JARDINAGEM', 'DEDETIZACAO')
        }

        // Administration and legal
        suggestions.push('ADMINISTRACAO', 'ADVOCACIA', 'CONTABILIDADE')

        setSuggestedCategories(Array.from(new Set(suggestions)))
      } catch (err) {
        console.error('Error loading condominio:', err)
      }
    }
    loadDetails()
  }, [selectedCondominio])

  const handleSearch = async () => {
    if (!condominioDetails) {
      setError('Selecione um condominio primeiro')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSearched(true)

      // Search for partners in the same city/state with suggested categories
      const results: ParceiroListResponse[] = []

      for (const categoria of suggestedCategories) {
        try {
          let found: ParceiroListResponse[] = []

          // Try city first
          if (condominioDetails.endereco?.cidade) {
            found = await parceiroService.findByCategoriaAndCidade(
              categoria,
              condominioDetails.endereco.cidade
            )
          }

          // If no results, try state
          if (found.length === 0 && condominioDetails.endereco?.estado) {
            found = await parceiroService.findByCategoriaAndEstado(
              categoria,
              condominioDetails.endereco.estado
            )
          }

          // If still no results, get any from this category
          if (found.length === 0) {
            found = await parceiroService.findByCategoria(categoria)
          }

          // Add unique results
          for (const p of found) {
            if (!results.find((r) => r.id === p.id)) {
              results.push(p)
            }
          }
        } catch {
          // Continue with other categories
        }
      }

      // Sort by rating
      results.sort((a, b) => (b.avaliacao || 0) - (a.avaliacao || 0))

      setParceiros(results)
    } catch (err) {
      console.error('Error searching:', err)
      setError('Erro ao buscar parceiros')
    } finally {
      setLoading(false)
    }
  }

  const getCategoriaColor = (categoria: CategoriaParceiro): string => {
    const colors: Record<string, string> = {
      ELEVADORES: '#6366f1',
      JARDINAGEM: '#22c55e',
      PORTARIA: '#3b82f6',
      LIMPEZA: '#14b8a6',
      ELETRICA: '#f59e0b',
      HIDRAULICA: '#06b6d4',
      INCENDIO: '#dc2626',
      CFTV: '#6366f1',
      PISCINA: '#3b82f6',
      ADMINISTRACAO: '#7c3aed',
      ADVOCACIA: '#8b5cf6',
      CONTABILIDADE: '#64748b',
      DEDETIZACAO: '#84cc16',
    }
    return colors[categoria] || '#94a3b8'
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/dashboard/parceiros')}
        >
          Voltar
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            Buscar Parceiros por Condominio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Encontre prestadores de servico baseado nas necessidades do condominio
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Selection */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ApartmentIcon sx={{ color: '#6366f1' }} />
          <Typography variant="h6" fontWeight="600">
            Selecionar Condominio
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="flex-end">
          <Grid item xs={12} md={8}>
            <FormControl fullWidth>
              <InputLabel>Condominio</InputLabel>
              <Select
                value={selectedCondominio}
                label="Condominio"
                onChange={(e) => setSelectedCondominio(e.target.value)}
                disabled={loadingCondominios}
              >
                {condominios.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ApartmentIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                      {c.nome} - {c.cidade}/{c.estado}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={!selectedCondominio || loading}
              sx={{ height: 56, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
            >
              Buscar Parceiros
            </Button>
          </Grid>
        </Grid>

        {/* Condominio Details & Suggestions */}
        {condominioDetails && (
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e2e8f0' }}>
            <Grid container spacing={3}>
              {/* Características */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Caracteristicas do Condominio
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {condominioDetails.caracteristicas?.tipoConstrucao && (
                    <Chip
                      icon={<ApartmentIcon />}
                      label={condominioDetails.caracteristicas.tipoConstrucao}
                      size="small"
                    />
                  )}
                  {condominioDetails.caracteristicas?.numeroUnidades && (
                    <Chip
                      label={`${condominioDetails.caracteristicas.numeroUnidades} unidades`}
                      size="small"
                    />
                  )}
                  {(condominioDetails.caracteristicas?.numeroElevadores ?? 0) > 0 && (
                    <Chip
                      icon={<ElevatorIcon />}
                      label={`${condominioDetails.caracteristicas?.numeroElevadores} elevadores`}
                      size="small"
                      sx={{ bgcolor: '#6366f115', color: '#6366f1' }}
                    />
                  )}
                  {condominioDetails.amenidades?.temPiscina && (
                    <Chip
                      icon={<PoolIcon />}
                      label="Piscina"
                      size="small"
                      sx={{ bgcolor: '#3b82f615', color: '#3b82f6' }}
                    />
                  )}
                  {condominioDetails.amenidades?.temAcademia && (
                    <Chip
                      icon={<FitnessCenterIcon />}
                      label="Academia"
                      size="small"
                      sx={{ bgcolor: '#22c55e15', color: '#22c55e' }}
                    />
                  )}
                  {condominioDetails.amenidades?.temPortaria24h && (
                    <Chip
                      icon={<SecurityIcon />}
                      label="Portaria 24h"
                      size="small"
                      sx={{ bgcolor: '#f59e0b15', color: '#f59e0b' }}
                    />
                  )}
                </Box>
              </Grid>

              {/* Categorias Sugeridas */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AutoAwesomeIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Categorias Sugeridas
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {suggestedCategories.map((cat) => (
                    <Chip
                      key={cat}
                      label={CATEGORIAS_PARCEIRO[cat]}
                      size="small"
                      sx={{
                        bgcolor: `${getCategoriaColor(cat)}15`,
                        color: getCategoriaColor(cat),
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Results */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : searched && parceiros.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Nenhum parceiro encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Nao encontramos parceiros na regiao do condominio. Tente a busca geral.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => router.push('/dashboard/parceiros')}
          >
            Ver Todos os Parceiros
          </Button>
        </Paper>
      ) : parceiros.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight="600">
              {parceiros.length} parceiros encontrados
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {parceiros.map((parceiro) => (
              <Grid item xs={12} sm={6} key={parceiro.id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Avatar
                        src={parceiro.logoUrl}
                        sx={{ width: 56, height: 56, bgcolor: '#6366f1' }}
                      >
                        <BusinessIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {parceiro.nomeFantasia || parceiro.nome}
                          </Typography>
                          {parceiro.verificado && (
                            <Tooltip title="Parceiro Verificado">
                              <VerifiedIcon sx={{ fontSize: 18, color: '#22c55e' }} />
                            </Tooltip>
                          )}
                        </Box>

                        {parceiro.avaliacao !== undefined && parceiro.avaliacao !== null && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Rating value={parceiro.avaliacao} size="small" readOnly />
                            <Typography variant="caption" color="text.secondary">
                              ({parceiro.totalAvaliacoes || 0})
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {parceiro.categorias.slice(0, 3).map((cat) => (
                            <Chip
                              key={cat}
                              label={CATEGORIAS_PARCEIRO[cat]}
                              size="small"
                              sx={{
                                bgcolor: `${getCategoriaColor(cat)}15`,
                                color: getCategoriaColor(cat),
                                fontSize: 10,
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

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

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        onClick={() => router.push(`/dashboard/parceiros/${parceiro.id}`)}
                        sx={{ color: '#6366f1' }}
                      >
                        Ver Detalhes
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        href={`tel:${parceiro.telefone}`}
                        sx={{ ml: 'auto', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
                        startIcon={<PhoneIcon />}
                      >
                        Contatar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : null}
    </Box>
  )
}
