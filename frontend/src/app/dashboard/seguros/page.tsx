'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
  Tooltip,
  Alert,
  Skeleton,
  Snackbar,
} from '@mui/material'
import SecurityIcon from '@mui/icons-material/Security'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import RefreshIcon from '@mui/icons-material/Refresh'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { apoliceService, getStatusApoliceLabel, getStatusApoliceColor } from '@/services/apoliceService'
import { ApoliceListResponse, ApoliceFilter, StatusApoliceType, Page } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext'
import { exportToCsv } from '@/utils/exportCsv'

// ---------------------------------------------------------------------------
// Currency & date formatters
// ---------------------------------------------------------------------------

function formatCurrency(value: number | undefined | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: string | undefined | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

// ---------------------------------------------------------------------------
// StatCard component
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function SegurosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { confirm: confirmDialog } = useConfirmDialog()

  // Data state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Page<ApoliceListResponse> | null>(null)

  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Search & filter
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusApoliceType | null>(null)

  // Menus
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null)

  // Feedback
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  // ---------------------------------------------------------------------------
  // Fetch data
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filter: ApoliceFilter = {}
      if (search) filter.search = search
      if (statusFilter) filter.status = statusFilter
      if (statusFilter === 'VIGENTE') filter.vigente = true
      if (statusFilter === 'VENCIDA') filter.vencendo = false

      const response = await apoliceService.list(filter, {
        page,
        size: rowsPerPage,
        sort: 'dataFim,asc',
      })
      setData(response)
    } catch (err) {
      console.error('Error fetching apolices:', err)
      setError('Erro ao carregar apólices. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, search, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    if (!data) return { total: 0, vigentes: 0, vencendo: 0, vencidas: 0 }
    const content = data.content
    return {
      total: data.totalElements,
      vigentes: content.filter((a) => a.status === 'VIGENTE').length,
      vencendo: content.filter((a) => a.status === 'EM_RENOVACAO' || a.status === 'PENDENTE').length,
      vencidas: content.filter((a) => a.status === 'VENCIDA').length,
    }
  }, [data])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(0)
  }

  const handleStatusFilter = (status: StatusApoliceType | null) => {
    setStatusFilter((prev) => (prev === status ? null : status))
    setPage(0)
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
    if (selectedId) router.push(`/dashboard/seguros/${selectedId}`)
    handleMenuClose()
  }

  const handleRenovar = async () => {
    if (!selectedId) {
      handleMenuClose()
      return
    }
    const ok = await confirmDialog({
      title: 'Confirmar renovação',
      message: 'Deseja iniciar o processo de renovação desta apólice?',
      severity: 'warning',
      confirmText: 'Renovar',
      cancelText: 'Cancelar',
    })
    if (ok) {
      try {
        await apoliceService.renovar(selectedId)
        setSnackbar({ open: true, message: 'Renovação iniciada com sucesso.' })
        fetchData()
      } catch (err) {
        console.error('Error renewing apolice:', err)
        setError('Erro ao renovar apólice.')
      }
    }
    handleMenuClose()
  }

  const handleDelete = async () => {
    if (!selectedId) {
      handleMenuClose()
      return
    }
    const ok = await confirmDialog({
      title: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir esta apólice? Esta ação não pode ser desfeita.',
      severity: 'error',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    })
    if (ok) {
      try {
        await apoliceService.delete(selectedId)
        setSnackbar({ open: true, message: 'Apólice excluída com sucesso.' })
        fetchData()
      } catch (err) {
        console.error('Error deleting apolice:', err)
        setError('Erro ao excluir apólice.')
      }
    }
    handleMenuClose()
  }

  const handleExportCSV = () => {
    if (!data?.content.length) return
    const columns = [
      { key: 'numeroApolice', label: 'Número Apólice' },
      { key: 'condominio', label: 'Condomínio' },
      { key: 'seguradora', label: 'Seguradora' },
      { key: 'status', label: 'Status' },
      { key: 'dataInicio', label: 'Início Vigência' },
      { key: 'dataFim', label: 'Fim Vigência' },
      { key: 'premioTotal', label: 'Prêmio Total' },
      { key: 'coberturas', label: 'Coberturas' },
    ]
    const csvData = data.content.map((a) => ({
      numeroApolice: a.numeroApolice || '-',
      condominio: a.condominioNome || '-',
      seguradora: a.seguradoraNome || '-',
      status: getStatusApoliceLabel(a.status),
      dataInicio: formatDate(a.dataInicio),
      dataFim: formatDate(a.dataFim),
      premioTotal: a.premioTotal ? formatCurrency(a.premioTotal) : '-',
      coberturas: String(a.quantidadeCoberturas || 0),
    }))
    exportToCsv(csvData, `apolices_${new Date().toISOString().split('T')[0]}`, columns)
    setExportAnchor(null)
    setSnackbar({ open: true, message: 'Arquivo CSV exportado com sucesso.' })
  }

  // ---------------------------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------------------------

  const canCreate = user?.role === 'ADMIN' || user?.role === 'CORRETORA' || user?.role === 'ADMINISTRADORA'
  const canDelete = user?.role === 'ADMIN' || user?.role === 'CORRETORA'

  // ---------------------------------------------------------------------------
  // Table header cell style
  // ---------------------------------------------------------------------------

  const thSx = {
    fontWeight: 700,
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    color: 'text.secondary',
    letterSpacing: 0.5,
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Apólices de Seguro
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie as apólices de seguro dos condomínios
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Atualizar">
            <IconButton onClick={fetchData} size="small">
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
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/dashboard/seguros/novo')}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Nova Apólice
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
      </Menu>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={88} />
          ))
        ) : (
          <>
            <StatCard
              title="Total Apólices"
              value={stats.total}
              icon={SecurityIcon}
              color="#3b82f6"
              bgColor="#eff6ff"
              onClick={() => handleStatusFilter(null)}
            />
            <StatCard
              title="Vigentes"
              value={stats.vigentes}
              icon={CheckCircleIcon}
              color="#16a34a"
              bgColor="#f0fdf4"
              onClick={() => handleStatusFilter('VIGENTE')}
            />
            <StatCard
              title="Vencendo"
              value={stats.vencendo}
              icon={WarningAmberIcon}
              color="#d97706"
              bgColor="#fffbeb"
              onClick={() => handleStatusFilter('EM_RENOVACAO')}
            />
            <StatCard
              title="Vencidas"
              value={stats.vencidas}
              icon={ErrorIcon}
              color="#dc2626"
              bgColor="#fef2f2"
              onClick={() => handleStatusFilter('VENCIDA')}
            />
          </>
        )}
      </Box>

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar por número, condomínio ou seguradora..."
            value={search}
            onChange={handleSearchChange}
            sx={{ flex: 1, minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label="Vigentes"
              size="small"
              variant={statusFilter === 'VIGENTE' ? 'filled' : 'outlined'}
              color="success"
              onClick={() => handleStatusFilter('VIGENTE')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Vencendo"
              size="small"
              variant={statusFilter === 'EM_RENOVACAO' || statusFilter === 'PENDENTE' ? 'filled' : 'outlined'}
              color="warning"
              onClick={() => handleStatusFilter('PENDENTE')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Vencidas"
              size="small"
              variant={statusFilter === 'VENCIDA' ? 'filled' : 'outlined'}
              color="error"
              onClick={() => handleStatusFilter('VENCIDA')}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
        {/* Result count */}
        {data && !loading && (
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
            <Typography variant="body2" color="text.secondary">
              {data.totalElements === 0
                ? 'Nenhuma apólice encontrada'
                : `${data.totalElements} apólice${data.totalElements !== 1 ? 's' : ''} encontrada${data.totalElements !== 1 ? 's' : ''}`}
              {(statusFilter || search) && (
                <>
                  {' '}&bull;{' '}
                  <Button
                    size="small"
                    sx={{ ml: 0.5, textTransform: 'none', p: 0, minWidth: 'auto' }}
                    onClick={() => {
                      setStatusFilter(null)
                      setSearch('')
                      setPage(0)
                    }}
                  >
                    Limpar filtros
                  </Button>
                </>
              )}
            </Typography>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={thSx}>Número Apólice</TableCell>
                <TableCell sx={thSx}>Condomínio</TableCell>
                <TableCell sx={thSx}>Seguradora</TableCell>
                <TableCell sx={thSx}>Status</TableCell>
                <TableCell sx={thSx}>Vigência</TableCell>
                <TableCell sx={thSx} align="right">Prêmio Total</TableCell>
                <TableCell sx={thSx} align="center">Coberturas</TableCell>
                <TableCell sx={thSx} align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <SecurityIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={500}>
                      Nenhuma apólice encontrada
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                      {search || statusFilter
                        ? 'Tente ajustar os filtros de busca'
                        : 'Cadastre a primeira apólice para começar'}
                    </Typography>
                    {canCreate && !search && !statusFilter && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        sx={{ mt: 2 }}
                        onClick={() => router.push('/dashboard/seguros/novo')}
                      >
                        Nova Apólice
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((apolice) => {
                  const chipColor = getStatusApoliceColor(apolice.status)
                  return (
                    <TableRow
                      key={apolice.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f8fafc' },
                        '&:last-child td': { borderBottom: 0 },
                      }}
                      onClick={() => router.push(`/dashboard/seguros/${apolice.id}`)}
                    >
                      {/* Numero Apolice */}
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
                            <SecurityIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                          </Box>
                          <Typography fontWeight={600} fontSize="0.875rem" sx={{ fontFamily: 'monospace' }}>
                            {apolice.numeroApolice || '-'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Condominio */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {apolice.condominioNome || '-'}
                        </Typography>
                      </TableCell>

                      {/* Seguradora */}
                      <TableCell>
                        <Typography variant="body2">
                          {apolice.seguradoraNome || '-'}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={getStatusApoliceLabel(apolice.status)}
                          size="small"
                          color={chipColor}
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>

                      {/* Vigencia */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {formatDate(apolice.dataInicio)} - {formatDate(apolice.dataFim)}
                        </Typography>
                      </TableCell>

                      {/* Premio Total */}
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(apolice.premioTotal)}
                        </Typography>
                      </TableCell>

                      {/* Coberturas */}
                      <TableCell align="center">
                        <Chip
                          label={apolice.quantidadeCoberturas || 0}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            minWidth: 40,
                          }}
                        />
                      </TableCell>

                      {/* Acoes */}
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, apolice.id)}
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

        {/* Pagination */}
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
        <MenuItem onClick={handleRenovar}>
          <AutorenewIcon fontSize="small" sx={{ mr: 1 }} />
          Renovar
        </MenuItem>
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
