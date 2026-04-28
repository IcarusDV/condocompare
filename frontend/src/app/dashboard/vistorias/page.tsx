'use client'

import { useState, useMemo } from 'react'
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
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Skeleton,
  TablePagination,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  vistoriaService,
  getTipoVistoriaLabel,
  getStatusVistoriaLabel,
  getStatusVistoriaColor,
} from '@/services/vistoriaService'
import { condominioService } from '@/services/condominioService'
import { useVistorias, useCreateVistoria } from '@/hooks/queries/useVistorias'
import { useCondominios } from '@/hooks/queries/useCondominios'
import {
  CreateVistoriaRequest,
  TipoVistoria,
  StatusVistoria,
  CondominioListResponse,
  VistoriaListResponse,
} from '@/types'

export default function VistoriasPage() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<CreateVistoriaRequest>({
    condominioId: '',
    tipo: 'PERIODICA',
    dataAgendada: '',
    responsavelNome: '',
    responsavelTelefone: '',
    responsavelEmail: '',
    observacoes: '',
  })

  // Filters
  const [filterCondominioId, setFilterCondominioId] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusVistoria | ''>('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const vistoriaFilter = useMemo(() => ({
    condominioId: filterCondominioId || undefined,
    status: filterStatus || undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
  }), [filterCondominioId, filterStatus, dataInicio, dataFim])

  const vistoriaPagination = useMemo(() => ({ page, size: rowsPerPage }), [page, rowsPerPage])

  const { data: vistoriasPage, isLoading: loading, error: queryError } = useVistorias(vistoriaFilter, vistoriaPagination)
  const { data: condominiosPage } = useCondominios()
  const createVistoria = useCreateVistoria()

  const vistorias = vistoriasPage?.content ?? []
  const totalElements = vistoriasPage?.totalElements ?? 0
  const condominios = condominiosPage?.content ?? []
  const error = queryError ? 'Erro ao carregar dados' : null
  const saving = createVistoria.isPending

  const handleOpenCreate = () => {
    setFormData({
      condominioId: '',
      tipo: 'PERIODICA',
      dataAgendada: '',
      responsavelNome: '',
      responsavelTelefone: '',
      responsavelEmail: '',
      observacoes: '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      await createVistoria.mutateAsync(formData)
      setDialogOpen(false)
    } catch (err) {
      console.error('Error saving:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Vistorias
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Vistoria
        </Button>
      </Box>

      {/* Aviso sobre vistorias */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{ mb: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}
      >
        <Typography variant="body2">
          <strong>Importante:</strong> As vistorias cadastradas aqui são independentes e não estão vinculadas diretamente a nenhuma seguradora.
          Servem para controle interno e documentação do condomínio.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Condominio</InputLabel>
              <Select
                value={filterCondominioId}
                label="Condomínio"
                onChange={(e) => setFilterCondominioId(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {condominios.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value as StatusVistoria | '')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="AGENDADA">Agendada</MenuItem>
                <MenuItem value="EM_ANDAMENTO">Em Andamento</MenuItem>
                <MenuItem value="CONCLUIDA">Concluída</MenuItem>
                <MenuItem value="CANCELADA">Cancelada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="De"
              type="date"
              value={dataInicio}
              onChange={(e) => { setDataInicio(e.target.value); setPage(0) }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Até"
              type="date"
              value={dataFim}
              onChange={(e) => { setDataFim(e.target.value); setPage(0) }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box>
            <Skeleton variant="rectangular" height={48} animation="wave" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={52} animation="wave" sx={{ mt: '1px' }} />
            ))}
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Condomínio</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data Agendada</TableCell>
                  <TableCell>Responsável</TableCell>
                  <TableCell>Nota</TableCell>
                  <TableCell>Pendências</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vistorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Nenhuma vistoria encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  vistorias.map((vistoria) => (
                    <TableRow key={vistoria.id}>
                      <TableCell>{vistoria.condominioNome}</TableCell>
                      <TableCell>{getTipoVistoriaLabel(vistoria.tipo)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusVistoriaLabel(vistoria.status)}
                          color={getStatusVistoriaColor(vistoria.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(vistoria.dataAgendada)}</TableCell>
                      <TableCell>{vistoria.responsavelNome || '-'}</TableCell>
                      <TableCell>{vistoria.notaGeral ?? '-'}</TableCell>
                      <TableCell>{vistoria.totalPendencias}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => router.push(`/dashboard/vistorias/${vistoria.id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalElements}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10))
                setPage(0)
              }}
              labelRowsPerPage="Linhas por página"
            />
          </>
        )}
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Vistoria</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Condominio</InputLabel>
                <Select
                  value={formData.condominioId}
                  label="Condomínio"
                  onChange={(e) => setFormData((prev) => ({ ...prev, condominioId: e.target.value }))}
                >
                  {condominios.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.tipo}
                  label="Tipo"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tipo: e.target.value as TipoVistoria }))
                  }
                >
                  <MenuItem value="INICIAL">Inicial</MenuItem>
                  <MenuItem value="PERIODICA">Periódica</MenuItem>
                  <MenuItem value="CONSTATACAO">Constatação</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Data Agendada"
                type="datetime-local"
                value={formData.dataAgendada}
                onChange={(e) => setFormData((prev) => ({ ...prev, dataAgendada: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Responsavel"
                value={formData.responsavelNome}
                onChange={(e) => setFormData((prev) => ({ ...prev, responsavelNome: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Telefone"
                value={formData.responsavelTelefone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, responsavelTelefone: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                type="email"
                value={formData.responsavelEmail}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, responsavelEmail: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Observacoes"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formData.condominioId || !formData.dataAgendada}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
