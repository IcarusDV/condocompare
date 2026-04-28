'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  TableSortLabel,
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
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
  Checkbox,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import UploadIcon from '@mui/icons-material/Upload'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import FilterListIcon from '@mui/icons-material/FilterList'
import DescriptionIcon from '@mui/icons-material/Description'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import SyncIcon from '@mui/icons-material/Sync'
import VisibilityIcon from '@mui/icons-material/Visibility'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EditIcon from '@mui/icons-material/Edit'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  documentoService,
  formatFileSize,
  getTipoDocumentoLabel,
  getStatusLabel,
  getStatusColor,
} from '@/services/documentoService'
import { condominioService } from '@/services/condominioService'
import { seguradoraService } from '@/services/seguradoraService'
import {
  DocumentoListResponse,
  DocumentoFilter,
  TipoDocumento,
  StatusProcessamento,
  CondominioListResponse,
  SeguradoraResponse,
  Page,
} from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { exportToCsv } from '@/utils/exportCsv'
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext'
import { DocumentoUploadDialog } from '@/components/documentos/DocumentoUploadDialog'

const statusIcons: Record<StatusProcessamento, React.ElementType> = {
  PENDENTE: HourglassEmptyIcon,
  PROCESSANDO: SyncIcon,
  CONCLUIDO: CheckCircleIcon,
  ERRO: ErrorIcon,
}

const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return InsertDriveFileIcon
  if (mimeType.includes('pdf')) return PictureAsPdfIcon
  if (mimeType.includes('image')) return ImageIcon
  if (mimeType.includes('word')) return DescriptionIcon
  return InsertDriveFileIcon
}

const getTipoColor = (tipo: TipoDocumento): string => {
  const colors: Record<TipoDocumento, string> = {
    APOLICE: '#8b5cf6',
    ORCAMENTO: '#3b82f6',
    CONDICOES_GERAIS: '#6b7280',
    LAUDO_VISTORIA: '#f59e0b',
    SINISTRO: '#ef4444',
    CONVENCAO: '#0891b2',
    REGIMENTO_INTERNO: '#0d9488',
    ATA_ASSEMBLEIA: '#7c3aed',
    HABITE_SE: '#65a30d',
    AVCB: '#dc2626',
    ALVARA: '#ea580c',
    LAUDO_TECNICO: '#facc15',
    PLANTA: '#14b8a6',
    CONTRATO: '#a855f7',
    OUTRO: '#94a3b8',
  }
  return colors[tipo] || '#94a3b8'
}

type SortField = 'nome' | 'tipo' | 'tamanhoBytes' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function DocumentosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { confirm: confirmDialog } = useConfirmDialog()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Page<DocumentoListResponse> | null>(null)
  const [condominios, setCondominios] = useState<CondominioListResponse[]>([])
  const [condominiosMap, setCondominiosMap] = useState<Record<string, string>>({})
  const [seguradoras, setSeguradoras] = useState<SeguradoraResponse[]>([])
  const [page, setPage] = useState(() => {
    const p = searchParams.get('page')
    return p ? parseInt(p, 10) : 0
  })
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(() => {
    return !!(searchParams.get('tipo') || searchParams.get('status') || searchParams.get('seguradora') || searchParams.get('condominioId'))
  })
  const [filters, setFilters] = useState<DocumentoFilter>(() => {
    const f: DocumentoFilter = {}
    const tipo = searchParams.get('tipo')
    const status = searchParams.get('status')
    const seguradora = searchParams.get('seguradora')
    const condominioId = searchParams.get('condominioId')
    if (tipo) f.tipo = tipo as TipoDocumento
    if (status) f.status = status as StatusProcessamento
    if (seguradora) f.seguradora = seguradora
    if (condominioId) f.condominioId = condominioId
    return f
  })
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedDoc, setSelectedDoc] = useState<DocumentoListResponse | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sortField, setSortField] = useState<SortField>(() => {
    const sort = searchParams.get('sort')
    if (sort) {
      const [field] = sort.split(',')
      if (['nome', 'tipo', 'tamanhoBytes', 'status', 'createdAt'].includes(field)) {
        return field as SortField
      }
    }
    return 'createdAt'
  })
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const sort = searchParams.get('sort')
    if (sort) {
      const parts = sort.split(',')
      if (parts[1] === 'asc' || parts[1] === 'desc') return parts[1]
    }
    return 'desc'
  })

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  // Sync filters/search/page/sort to URL search params
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filters.tipo) params.set('tipo', filters.tipo)
    if (filters.status) params.set('status', filters.status)
    if (filters.seguradora) params.set('seguradora', filters.seguradora)
    if (filters.condominioId) params.set('condominioId', filters.condominioId)
    if (page > 0) params.set('page', String(page))
    const sortStr = `${sortField},${sortDirection}`
    if (sortStr !== 'createdAt,desc') params.set('sort', sortStr)
    const qs = params.toString()
    router.replace(`/dashboard/documentos${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [search, filters, page, sortField, sortDirection, router])

  useEffect(() => {
    const loadCondominios = async () => {
      try {
        const response = await condominioService.list({}, { size: 200 })
        setCondominios(response.content)
        const map: Record<string, string> = {}
        response.content.forEach(c => { map[c.id] = c.nome })
        setCondominiosMap(map)
      } catch (err) {
        console.error('Error loading condominios:', err)
      }
    }
    const loadSeguradoras = async () => {
      try {
        const response = await seguradoraService.list()
        setSeguradoras(response)
      } catch (err) {
        console.error('Error loading seguradoras:', err)
      }
    }
    loadCondominios()
    loadSeguradoras()
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await documentoService.list(
        { ...filters, search: search || undefined },
        { page, size: rowsPerPage, sort: `${sortField},${sortDirection}` }
      )
      setData(response)
    } catch (err) {
      console.error('Error fetching documentos:', err)
      setError('Erro ao carregar documentos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, search, filters, sortField, sortDirection])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh when there are PROCESSANDO documents
  const hasProcessing = data?.content.some(d => d.status === 'PROCESSANDO') || false
  const processingCount = data?.content.filter(d => d.status === 'PROCESSANDO').length || 0
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (hasProcessing) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData()
      }, 8000)
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
    }
  }, [hasProcessing, fetchData])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(0)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(0)
  }

  const handleFilterChange = (key: keyof DocumentoFilter, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }))
    setPage(0)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, doc: DocumentoListResponse) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    setSelectedDoc(doc)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedDoc(null)
  }

  const handleDownload = async () => {
    if (!selectedDoc) return
    try {
      setDownloading(true)
      const url = await documentoService.getDownloadUrl(selectedDoc.id)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error getting download URL:', err)
      setError('Erro ao baixar documento.')
    } finally {
      setDownloading(false)
      handleMenuClose()
    }
  }

  const handleDelete = async () => {
    if (!selectedDoc) { handleMenuClose(); return }
    const ok = await confirmDialog({
      title: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este documento?',
      severity: 'error',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    })
    if (ok) {
      try {
        await documentoService.delete(selectedDoc.id)
        setSelected(prev => { const n = new Set(prev); n.delete(selectedDoc.id); return n })
        fetchData()
      } catch (err) {
        console.error('Error deleting documento:', err)
        setError('Erro ao excluir documento.')
      }
    }
    handleMenuClose()
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    const ok = await confirmDialog({
      title: 'Confirmar exclusão em massa',
      message: `Tem certeza que deseja excluir ${selected.size} documento(s)?`,
      severity: 'error',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    })
    if (!ok) return
    try {
      setDeleting(true)
      await documentoService.deleteMultiple(Array.from(selected))
      setSelected(new Set())
      fetchData()
    } catch (err) {
      console.error('Error bulk deleting:', err)
      setError('Erro ao excluir documentos.')
    } finally {
      setDeleting(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.content) {
      setSelected(new Set(data.content.map(d => d.id)))
    } else {
      setSelected(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (checked) n.add(id)
      else n.delete(id)
      return n
    })
  }

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false)
    fetchData()
  }

  const handleReprocess = async () => {
    if (!selectedDoc) { handleMenuClose(); return }
    try {
      await documentoService.reprocess(selectedDoc.id)
      fetchData()
    } catch (err) {
      console.error('Error reprocessing documento:', err)
      setError('Erro ao reprocessar documento.')
    }
    handleMenuClose()
  }

  const canUpload = user?.role === 'ADMIN' || user?.role === 'CORRETORA' || user?.role === 'ADMINISTRADORA' || user?.role === 'SINDICO'
  const canDelete = user?.role === 'ADMIN' || user?.role === 'CORRETORA'

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const isVencendo = (doc: DocumentoListResponse) => {
    if (!doc.dataVigenciaFim || doc.tipo !== 'APOLICE') return false
    const fim = new Date(doc.dataVigenciaFim)
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return fim > now && fim <= thirtyDays
  }

  const isVencido = (doc: DocumentoListResponse) => {
    if (!doc.dataVigenciaFim || doc.tipo !== 'APOLICE') return false
    return new Date(doc.dataVigenciaFim) < new Date()
  }

  const handleExportCSV = () => {
    if (!data?.content.length) return
    const columns = [
      { key: 'nome', label: 'Nome' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'condominio', label: 'Condominio' },
      { key: 'seguradora', label: 'Seguradora' },
      { key: 'status', label: 'Status' },
      { key: 'tamanho', label: 'Tamanho' },
      { key: 'dataUpload', label: 'Data Upload' },
    ]
    const csvData = data.content.map(doc => ({
      nome: doc.nome,
      tipo: getTipoDocumentoLabel(doc.tipo),
      condominio: condominiosMap[doc.condominioId] || '',
      seguradora: doc.seguradoraNome || '',
      status: getStatusLabel(doc.status),
      tamanho: formatFileSize(doc.tamanhoBytes),
      dataUpload: doc.createdAt,
    }))
    exportToCsv(csvData, `documentos_${new Date().toISOString().split('T')[0]}`, columns)
  }

  const allSelected = data?.content && data.content.length > 0 && data.content.every(d => selected.has(d.id))

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Documentos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie apólices, orçamentos e outros documentos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={!data?.content.length}
          >
            Relatórios
          </Button>
          {canUpload && (
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Upload Documento
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nome do documento..."
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Condominio</InputLabel>
              <Select
                value={filters.condominioId || ''}
                label="Condomínio"
                onChange={(e) => handleFilterChange('condominioId', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {condominios.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Seguradora</InputLabel>
              <Select
                value={filters.seguradora || ''}
                label="Seguradora"
                onChange={(e) => handleFilterChange('seguradora', e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {seguradoras.map((s) => (
                  <MenuItem key={s.id} value={s.nome}>{s.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              {selected.size > 0 && canDelete && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleBulkDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Excluindo...' : `Excluir ${selected.size}`}
                </Button>
              )}
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                size="small"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtros
              </Button>
            </Box>
          </Grid>
        </Grid>

        {showFilters && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filters.tipo || ''}
                  label="Tipo"
                  onChange={(e) => handleFilterChange('tipo', e.target.value as TipoDocumento)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="APOLICE">Apólice</MenuItem>
                  <MenuItem value="ORCAMENTO">Orçamento</MenuItem>
                  <MenuItem value="CONDICOES_GERAIS">Condições Gerais</MenuItem>
                  <MenuItem value="LAUDO_VISTORIA">Laudo de Vistoria</MenuItem>
                  <MenuItem value="SINISTRO">Sinistro</MenuItem>
                  <MenuItem value="CONVENCAO">Convenção</MenuItem>
                  <MenuItem value="REGIMENTO_INTERNO">Regimento Interno</MenuItem>
                  <MenuItem value="ATA_ASSEMBLEIA">Ata de Assembleia</MenuItem>
                  <MenuItem value="HABITE_SE">Habite-se</MenuItem>
                  <MenuItem value="AVCB">AVCB (Bombeiros)</MenuItem>
                  <MenuItem value="ALVARA">Alvará</MenuItem>
                  <MenuItem value="LAUDO_TECNICO">Laudo Técnico</MenuItem>
                  <MenuItem value="PLANTA">Planta</MenuItem>
                  <MenuItem value="CONTRATO">Contrato</MenuItem>
                  <MenuItem value="OUTRO">Outro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value as StatusProcessamento)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="PENDENTE">Pendente</MenuItem>
                  <MenuItem value="PROCESSANDO">Processando</MenuItem>
                  <MenuItem value="CONCLUIDO">Concluído</MenuItem>
                  <MenuItem value="ERRO">Erro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Seguradora"
                value={filters.seguradora || ''}
                onChange={(e) => handleFilterChange('seguradora', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="text"
                size="small"
                onClick={() => { setFilters({}); setSearch(''); setPage(0) }}
              >
                Limpar Filtros
              </Button>
            </Grid>
          </Grid>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Processing Banner */}
      {processingCount > 0 && (
        <Alert
          severity="info"
          icon={<SyncIcon sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" fontWeight={500}>
            {processingCount} documento{processingCount > 1 ? 's' : ''} em processamento...
          </Typography>
        </Alert>
      )}

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {canDelete && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={!!allSelected}
                      indeterminate={selected.size > 0 && !allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortField === 'nome'}
                    direction={sortField === 'nome' ? sortDirection : 'asc'}
                    onClick={() => handleSort('nome')}
                  >
                    Documento
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Condominio</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortField === 'tipo'}
                    direction={sortField === 'tipo' ? sortDirection : 'asc'}
                    onClick={() => handleSort('tipo')}
                  >
                    Tipo
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortField === 'tamanhoBytes'}
                    direction={sortField === 'tamanhoBytes' ? sortDirection : 'asc'}
                    onClick={() => handleSort('tamanhoBytes')}
                  >
                    Tamanho
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortField === 'status'}
                    direction={sortField === 'status' ? sortDirection : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortField === 'createdAt'}
                    direction={sortField === 'createdAt' ? sortDirection : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    Data Upload
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canDelete ? 8 : 7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : data?.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canDelete ? 8 : 7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Nenhum documento encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((doc) => {
                  const FileIcon = getFileIcon(doc.mimeType)
                  const StatusIcon = statusIcons[doc.status]
                  const vencendo = isVencendo(doc)
                  const vencido = isVencido(doc)
                  const tipoColor = getTipoColor(doc.tipo)
                  return (
                    <TableRow
                      key={doc.id}
                      hover
                      sx={{
                        bgcolor: doc.status === 'PROCESSANDO' ? '#eff6ff' : vencido ? '#fef2f2' : vencendo ? '#fffbeb' : 'inherit',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: doc.status === 'PROCESSANDO' ? '#dbeafe' : vencido ? '#fee2e2' : vencendo ? '#fef3c7' : undefined },
                        ...(doc.status === 'PROCESSANDO' && {
                          animation: 'processingPulse 2s ease-in-out infinite',
                          '@keyframes processingPulse': {
                            '0%, 100%': { bgcolor: '#eff6ff' },
                            '50%': { bgcolor: '#dbeafe' },
                          },
                        }),
                      }}
                      onClick={() => router.push(`/dashboard/documentos/${doc.id}`)}
                    >
                      {canDelete && (
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            size="small"
                            checked={selected.has(doc.id)}
                            onChange={(e) => handleSelectOne(doc.id, e.target.checked)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <FileIcon sx={{ color: tipoColor }} />
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography fontWeight={500}>{doc.nome}</Typography>
                              {vencido && (
                                <Tooltip title="Apólice vencida!">
                                  <ErrorIcon sx={{ fontSize: 16, color: '#dc2626' }} />
                                </Tooltip>
                              )}
                              {vencendo && !vencido && (
                                <Tooltip title="Apólice vencendo em menos de 30 dias">
                                  <WarningAmberIcon sx={{ fontSize: 16, color: '#d97706' }} />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {doc.nomeArquivo}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {condominiosMap[doc.condominioId] || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTipoDocumentoLabel(doc.tipo)}
                          size="small"
                          sx={{
                            bgcolor: `${tipoColor}15`,
                            color: tipoColor,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            border: `1px solid ${tipoColor}30`,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {formatFileSize(doc.tamanhoBytes)}
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={doc.status === 'ERRO' && doc.erroProcessamento ? doc.erroProcessamento : ''}
                          arrow
                          disableHoverListener={doc.status !== 'ERRO' || !doc.erroProcessamento}
                        >
                          <Chip
                            icon={
                              <StatusIcon
                                style={{
                                  fontSize: 14,
                                  ...(doc.status === 'PROCESSANDO' && {
                                    animation: 'spin 1s linear infinite',
                                  }),
                                }}
                              />
                            }
                            label={doc.status === 'PROCESSANDO' ? 'Processando...' : getStatusLabel(doc.status)}
                            size="small"
                            color={getStatusColor(doc.status)}
                            variant={doc.status === 'CONCLUIDO' ? 'filled' : 'outlined'}
                            sx={{
                              fontWeight: 500,
                              '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' },
                              },
                              ...(doc.status === 'PROCESSANDO' && {
                                animation: 'pulse 2s ease-in-out infinite',
                                '@keyframes pulse': {
                                  '0%, 100%': { opacity: 1 },
                                  '50%': { opacity: 0.6 },
                                },
                              }),
                            }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(doc.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Ver detalhes">
                          <IconButton size="small" color="primary" onClick={() => router.push(`/dashboard/documentos/${doc.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, doc)}>
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
        <TablePagination
          component="div"
          count={data?.totalElements || 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          labelRowsPerPage="Linhas por pagina:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { handleMenuClose(); if (selectedDoc) router.push(`/dashboard/documentos/${selectedDoc.id}`) }}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Ver Detalhes
        </MenuItem>
        <MenuItem onClick={handleDownload} disabled={downloading}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          {downloading ? 'Baixando...' : 'Baixar'}
        </MenuItem>
        {selectedDoc?.status === 'ERRO' && (
          <MenuItem onClick={handleReprocess}>
            <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
            Reprocessar
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Excluir
          </MenuItem>
        )}
      </Menu>

      {/* Upload Dialog */}
      <DocumentoUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </Box>
  )
}
