'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  CircularProgress,
  Alert,
  Skeleton,
  Snackbar,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import FilterListIcon from '@mui/icons-material/FilterList'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ApartmentIcon from '@mui/icons-material/Apartment'
import SecurityIcon from '@mui/icons-material/Security'
import RefreshIcon from '@mui/icons-material/Refresh'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { condominioService } from '@/services/condominioService'
import { CondominioListResponse, CondominioFilter, TipoConstrucao, StatusApolice, Page } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { exportToCsv } from '@/utils/exportCsv'
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext'
import { useCondominios, useDeleteCondominio } from '@/hooks/queries/useCondominios'

const statusConfig: Record<StatusApolice, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  VENCIDA: { label: 'Vencida', color: '#dc2626', bgColor: '#fef2f2', icon: ErrorIcon },
  VENCENDO: { label: 'Vencendo', color: '#d97706', bgColor: '#fffbeb', icon: WarningAmberIcon },
  VIGENTE: { label: 'Vigente', color: '#16a34a', bgColor: '#f0fdf4', icon: CheckCircleIcon },
  SEM_APOLICE: { label: 'Sem Apólice', color: '#6b7280', bgColor: '#f9fafb', icon: HelpOutlineIcon },
}

const tipoConstrucaoLabels: Record<TipoConstrucao, string> = {
  RESIDENCIAL: 'Residencial',
  RESIDENCIAL_HORIZONTAL: 'Residencial Horizontal',
  RESIDENCIAL_COM_ESCRITORIOS: 'Residencial c/ Escritórios',
  COMERCIAL_VERTICAL: 'Comercial Vertical',
  COMERCIAL_HORIZONTAL: 'Comercial Horizontal',
  ESCRITORIOS_CONSULTORIOS: 'Escritórios/Consultórios',
  ESCRITORIOS_COM_COMERCIO: 'Escritórios c/ Comércio',
  LOGISTICO_INDUSTRIAL: 'Logístico/Industrial',
  CENTRO_COMERCIAL: 'Centro Comercial',
  GALERIA_COMERCIAL: 'Galeria Comercial',
  SHOPPING_CENTER: 'Shopping Center',
  EDIFICIO_GARAGEM: 'Edifício Garagem',
  MISTO: 'Misto',
  FLAT_APART_HOTEL: 'Flat/Apart-hotel',
  FLAT_COM_COMERCIO: 'Flat c/ Comércio',
  HOTEL: 'Hotel',
  EM_CONSTRUCAO: 'Em Construção',
  DESOCUPADO: 'Desocupado',
  OUTROS: 'Outros',
}

function getDiasChipColor(dias: number | undefined | null): { color: string; bgcolor: string } {
  if (dias === null || dias === undefined) return { color: '#6b7280', bgcolor: '#f3f4f6' }
  if (dias < 0) return { color: '#dc2626', bgcolor: '#fef2f2' }
  if (dias <= 15) return { color: '#dc2626', bgcolor: '#fef2f2' }
  if (dias <= 30) return { color: '#d97706', bgcolor: '#fffbeb' }
  if (dias <= 60) return { color: '#ca8a04', bgcolor: '#fefce8' }
  return { color: '#16a34a', bgcolor: '#f0fdf4' }
}

function formatDias(dias: number | undefined | null): string {
  if (dias === null || dias === undefined) return '-'
  if (dias < 0) return `${Math.abs(dias)}d atraso`
  if (dias === 0) return 'Hoje'
  return `${dias}d`
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: string
  bgColor: string
  onClick?: () => void
}

function StatCard({ title, value, icon: Icon, color, bgColor, onClick }: StatCardProps) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : {},
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: bgColor,
        }}
      >
        <Icon sx={{ fontSize: 24, color }} />
      </Box>
      <Box>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Paper>
  )
}

export default function CondominiosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { confirm: confirmDialog } = useConfirmDialog()
  const [page, setPage] = useState(() => {
    const p = searchParams.get('page')
    return p ? parseInt(p, 10) : 0
  })
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(() => {
    return !!(searchParams.get('estado') || searchParams.get('cidade') || searchParams.get('tipoConstrucao') || searchParams.get('seguradora'))
  })
  const [filters, setFilters] = useState<CondominioFilter>(() => {
    const f: CondominioFilter = {}
    const estado = searchParams.get('estado')
    const cidade = searchParams.get('cidade')
    const tipoConstrucao = searchParams.get('tipoConstrucao')
    const seguradora = searchParams.get('seguradora')
    if (estado) f.estado = estado
    if (cidade) f.cidade = cidade
    if (tipoConstrucao) f.tipoConstrucao = tipoConstrucao as TipoConstrucao
    if (seguradora) f.seguradora = seguradora
    return f
  })
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' })
  const [hasSearched, setHasSearched] = useState(() => {
    return !!(searchParams.get('search') || searchParams.get('estado') || searchParams.get('cidade') || searchParams.get('tipoConstrucao') || searchParams.get('seguradora'))
  })

  const queryFilter = useMemo(() => ({ ...filters, search: search || undefined }), [filters, search])
  const queryPagination = useMemo(() => ({ page, size: rowsPerPage, sort: 'nome,asc' }), [page, rowsPerPage])

  const { data, isLoading: loading, error: queryError, refetch } = useCondominios(queryFilter, queryPagination, hasSearched)
  const deleteCondominio = useDeleteCondominio()
  const error = queryError ? 'Erro ao carregar condomínios. Tente novamente.' : null

  // Sync filters/search/page to URL search params
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filters.estado) params.set('estado', filters.estado)
    if (filters.cidade) params.set('cidade', filters.cidade)
    if (filters.tipoConstrucao) params.set('tipoConstrucao', filters.tipoConstrucao)
    if (filters.seguradora) params.set('seguradora', filters.seguradora)
    if (page > 0) params.set('page', String(page))
    const qs = params.toString()
    router.replace(`/dashboard/condominios${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [search, filters, page, router])

  const stats = useMemo(() => {
    if (!data) return { total: 0, vigentes: 0, vencendo: 0, vencidas: 0 }
    const content = data.content
    return {
      total: data.totalElements,
      vigentes: content.filter(c => c.statusApolice === 'VIGENTE').length,
      vencendo: content.filter(c => c.statusApolice === 'VENCENDO').length,
      vencidas: content.filter(c => c.statusApolice === 'VENCIDA').length,
    }
  }, [data])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(0)
  }

  const handleSearchSubmit = () => {
    if (search.trim()) setHasSearched(true)
  }

  const handleFilterChange = (key: keyof CondominioFilter, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }))
    setPage(0)
    if (value) setHasSearched(true)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    setSelectedId(id)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedId(null)
  }

  const handleView = () => {
    if (selectedId) router.push(`/dashboard/condominios/${selectedId}`)
    handleMenuClose()
  }

  const handleEdit = () => {
    if (selectedId) router.push(`/dashboard/condominios/${selectedId}/editar`)
    handleMenuClose()
  }

  const handleDelete = async () => {
    if (!selectedId) { handleMenuClose(); return }
    const ok = await confirmDialog({
      title: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este condomínio?',
      severity: 'error',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    })
    if (ok) {
      try {
        await deleteCondominio.mutateAsync(selectedId)
        setSnackbar({ open: true, message: 'Condomínio excluído com sucesso.' })
      } catch (err) {
        console.error('Error deleting condominio:', err)
        setSnackbar({ open: true, message: 'Erro ao excluir condomínio.' })
      }
    }
    handleMenuClose()
  }

  const handleExportCSV = () => {
    if (!data?.content.length) return
    const columns = [
      { key: 'nome', label: 'Nome' },
      { key: 'cnpj', label: 'CNPJ' },
      { key: 'cidade', label: 'Cidade' },
      { key: 'estado', label: 'Estado' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'seguradora', label: 'Seguradora' },
      { key: 'statusApolice', label: 'Status Apólice' },
    ]
    const csvData = data.content.map(c => ({
      nome: c.nome,
      cnpj: c.cnpj || '',
      cidade: c.cidade || '',
      estado: c.estado || '',
      tipo: c.tipoConstrucao ? tipoConstrucaoLabels[c.tipoConstrucao] : '',
      seguradora: c.seguradoraAtual || '',
      statusApolice: statusConfig[c.statusApolice].label,
    }))
    exportToCsv(csvData, `condominios_${new Date().toISOString().split('T')[0]}`, columns)
    setExportAnchor(null)
    setSnackbar({ open: true, message: 'Arquivo CSV exportado com sucesso.' })
  }

  const canEdit = user?.role === 'ADMIN' || user?.role === 'CORRETORA' || user?.role === 'ADMINISTRADORA'
  const canDelete = user?.role === 'ADMIN' || user?.role === 'CORRETORA'
  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Condomínios
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie seus condomínios.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Atualizar">
            <IconButton onClick={() => refetch()} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={(e) => setExportAnchor(e.currentTarget)}
            disabled={!data?.content.length}
          >
            Exportar
          </Button>
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/dashboard/condominios/novo')}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Novo Condomínio
            </Button>
          )}
        </Box>
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
      >
        <MenuItem onClick={handleExportCSV}>
          <FileDownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Exportar CSV
        </MenuItem>
        <MenuItem onClick={() => {
          if (!data?.content.length) return
          const { exportService } = require('@/services/exportService')
          exportService.exportToPDF({
            title: 'Condomínios',
            subtitle: `Total: ${data.totalElements} condomínios`,
            columns: [
              { header: 'Nome', key: 'nome', width: 25 },
              { header: 'CNPJ', key: 'cnpj', width: 18 },
              { header: 'Cidade/UF', key: 'cidadeUf', width: 15 },
              { header: 'Tipo', key: 'tipo', width: 12 },
              { header: 'Seguradora', key: 'seguradora', width: 18 },
              { header: 'Status', key: 'status', width: 12 },
            ],
            data: data.content.map(c => ({
              nome: c.nome,
              cnpj: c.cnpj || '-',
              cidadeUf: c.cidade && c.estado ? `${c.cidade}/${c.estado}` : '-',
              tipo: c.tipoConstrucao ? tipoConstrucaoLabels[c.tipoConstrucao] : '-',
              seguradora: c.seguradoraAtual || '-',
              status: statusConfig[c.statusApolice].label,
            })),
            filename: `condominios_${new Date().toISOString().split('T')[0]}`,
          })
          setExportAnchor(null)
          setSnackbar({ open: true, message: 'PDF exportado com sucesso.' })
        }}>
          <PictureAsPdfIcon fontSize="small" sx={{ mr: 1 }} />
          Exportar PDF
        </MenuItem>
      </Menu>

      {/* Stats Cards */}
      {hasSearched && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={88} />
            ))
          ) : (
            <>
              <StatCard
                title="Total"
                value={stats.total}
                icon={ApartmentIcon}
                color="#3b82f6"
                bgColor="#eff6ff"
              />
              <StatCard
                title="Vigentes"
                value={stats.vigentes}
                icon={CheckCircleIcon}
                color="#16a34a"
                bgColor="#f0fdf4"
                onClick={() => {
                  setFilters({ apoliceVencendo: false, apoliceVencida: false })
                  setPage(0)
                }}
              />
            </>
          )}
        </Box>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar por nome, CNPJ ou cidade..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit() }}
            sx={{ flex: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleSearchSubmit}
            disabled={!search.trim()}
          >
            Buscar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              color={activeFiltersCount > 0 ? 'primary' : 'inherit'}
            >
              Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </Button>
          </Box>
        </Box>

        {showFilters && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.estado || ''}
                label="Estado"
                onChange={(e) => handleFilterChange('estado', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="SP">São Paulo</MenuItem>
                <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                <MenuItem value="MG">Minas Gerais</MenuItem>
                <MenuItem value="PR">Paraná</MenuItem>
                <MenuItem value="RS">Rio Grande do Sul</MenuItem>
                <MenuItem value="SC">Santa Catarina</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Cidade"
              value={filters.cidade || ''}
              onChange={(e) => handleFilterChange('cidade', e.target.value)}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filters.tipoConstrucao || ''}
                label="Tipo"
                onChange={(e) => handleFilterChange('tipoConstrucao', e.target.value as TipoConstrucao)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="RESIDENCIAL">Residencial</MenuItem>
                <MenuItem value="COMERCIAL">Comercial</MenuItem>
                <MenuItem value="MISTO">Misto</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Seguradora"
              value={filters.seguradora || ''}
              onChange={(e) => handleFilterChange('seguradora', e.target.value)}
            />
          </Box>
        )}
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      {!hasSearched ? (
        <Paper sx={{ border: '1px solid', borderColor: 'divider', p: 6, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Busque por um condomínio
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Use a barra de busca acima para encontrar condomínios por nome, CNPJ ou cidade.
          </Typography>
        </Paper>
      ) : (
      <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
        {/* Result count */}
        {data && !loading && (
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
            <Typography variant="body2" color="text.secondary">
              {data.totalElements === 0
                ? 'Nenhum condomínio encontrado'
                : `${data.totalElements} condomínio${data.totalElements !== 1 ? 's' : ''} encontrado${data.totalElements !== 1 ? 's' : ''}`
              }
              {(filters.apoliceVencendo || filters.apoliceVencida || filters.estado || filters.cidade || filters.tipoConstrucao || filters.seguradora) && (
                <> &bull; <Button size="small" sx={{ ml: 0.5, textTransform: 'none', p: 0, minWidth: 'auto' }} onClick={() => { setFilters({}); setPage(0) }}>Limpar filtros</Button></>
              )}
            </Typography>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }}>
                  Nome
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }}>
                  CNPJ
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }}>
                  Cidade/UF
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }}>
                  Tipo
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }} align="center">
                  Unidades
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }}>
                  Seguradora
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }} align="center">
                  Dias
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }}>
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <ApartmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={500}>
                      Nenhum condomínio encontrado
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                      {search || Object.keys(filters).length > 0
                        ? 'Tente ajustar os filtros de busca'
                        : 'Cadastre o primeiro condomínio para começar'
                      }
                    </Typography>
                    {canEdit && !search && Object.keys(filters).length === 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        sx={{ mt: 2 }}
                        onClick={() => router.push('/dashboard/condominios/novo')}
                      >
                        Novo Condomínio
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((condominio) => {
                  const status = statusConfig[condominio.statusApolice]
                  const StatusIcon = status.icon
                  const diasColor = getDiasChipColor(condominio.diasParaVencimento)
                  return (
                    <TableRow
                      key={condominio.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f8fafc' },
                        '&:last-child td': { borderBottom: 0 },
                      }}
                      onClick={() => router.push(`/dashboard/condominios/${condominio.id}`)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 1.5,
                              bgcolor: '#eff6ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <ApartmentIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                          </Box>
                          <Typography fontWeight={600} fontSize="0.875rem">
                            {condominio.nome}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {condominio.cnpj || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {condominio.cidade && condominio.estado
                            ? `${condominio.cidade}/${condominio.estado}`
                            : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {condominio.tipoConstrucao
                            ? tipoConstrucaoLabels[condominio.tipoConstrucao]
                            : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={500}>
                          {condominio.numeroUnidades || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {condominio.seguradoraAtual && (
                            <SecurityIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          )}
                          <Typography variant="body2">
                            {condominio.seguradoraAtual || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<StatusIcon style={{ fontSize: 14 }} />}
                          label={status.label}
                          size="small"
                          sx={{
                            color: status.color,
                            bgcolor: status.bgColor,
                            border: `1px solid ${status.color}20`,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': { color: status.color },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {condominio.statusApolice !== 'SEM_APOLICE' ? (
                          <Chip
                            label={formatDias(condominio.diasParaVencimento)}
                            size="small"
                            sx={{
                              color: diasColor.color,
                              bgcolor: diasColor.bgcolor,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              minWidth: 56,
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, condominio.id)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {data && data.totalElements > 0 && (
          <TablePagination
            component="div"
            count={data.totalElements}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </Paper>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleView}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Visualizar
        </MenuItem>
        {canEdit && (
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Editar
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Excluir
          </MenuItem>
        )}
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
