'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonIcon from '@mui/icons-material/Person'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import RefreshIcon from '@mui/icons-material/Refresh'
import { userService, getRoleLabel, getRoleColor } from '@/services/userService'
import { UserListResponse, UserFilter, Role, Page, CreateUserRequest, UpdateUserRequest } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext'

const ALL_ROLES: Role[] = ['ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO']

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

interface UserFormData {
  name: string
  email: string
  password: string
  role: Role
  organizationName: string
  phone: string
}

const emptyFormData: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'SINDICO',
  organizationName: '',
  phone: '',
}

export default function UsuariosPage() {
  const { user } = useAuth()
  const { confirm: confirmDialog } = useConfirmDialog()

  // Data state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Page<UserListResponse> | null>(null)

  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Search & filters
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<Role | ''>('')
  const [filterActive, setFilterActive] = useState<string>('')

  // Actions menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedUser, setSelectedUser] = useState<UserListResponse | null>(null)

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState<UserFormData>(emptyFormData)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  // Access check
  if (user?.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Acesso restrito a administradores</Alert>
      </Box>
    )
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const filter: UserFilter = {}
      if (search) filter.search = search
      if (filterRole) filter.role = filterRole
      if (filterActive === 'true') filter.active = true
      if (filterActive === 'false') filter.active = false

      const response = await userService.list(filter, {
        page,
        size: rowsPerPage,
        sort: 'name,asc',
      })
      setData(response)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Erro ao carregar usuarios. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, search, filterRole, filterActive])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Stats computed from current page data
  const stats = {
    total: data?.totalElements ?? 0,
    admin: data?.content.filter(u => u.role === 'ADMIN').length ?? 0,
    corretora: data?.content.filter(u => u.role === 'CORRETORA').length ?? 0,
    administradora: data?.content.filter(u => u.role === 'ADMINISTRADORA').length ?? 0,
    sindico: data?.content.filter(u => u.role === 'SINDICO').length ?? 0,
  }

  // Handlers - search & filters
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(0)
  }

  const handleRoleFilterChange = (value: string) => {
    setFilterRole(value as Role | '')
    setPage(0)
  }

  const handleActiveFilterChange = (value: string) => {
    setFilterActive(value)
    setPage(0)
  }

  // Handlers - actions menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userItem: UserListResponse) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    setSelectedUser(userItem)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedUser(null)
  }

  // Handlers - dialog
  const handleOpenCreate = () => {
    setFormData(emptyFormData)
    setFormError(null)
    setDialogMode('create')
    setEditingUserId(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = () => {
    if (!selectedUser) return
    setFormData({
      name: selectedUser.name,
      email: selectedUser.email,
      password: '',
      role: selectedUser.role,
      organizationName: selectedUser.organizationName || '',
      phone: selectedUser.phone || '',
    })
    setFormError(null)
    setDialogMode('edit')
    setEditingUserId(selectedUser.id)
    setDialogOpen(true)
    handleMenuClose()
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setFormData(emptyFormData)
    setFormError(null)
    setEditingUserId(null)
  }

  const handleFormChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      setFormError('Nome e obrigatorio.')
      return
    }
    if (!formData.email.trim()) {
      setFormError('Email e obrigatorio.')
      return
    }
    if (dialogMode === 'create' && !formData.password.trim()) {
      setFormError('Senha e obrigatoria para novos usuarios.')
      return
    }

    try {
      setFormLoading(true)
      setFormError(null)

      if (dialogMode === 'create') {
        const request: CreateUserRequest = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          organizationName: formData.organizationName.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        }
        await userService.create(request)
        setSnackbar({ open: true, message: 'Usuario criado com sucesso.' })
      } else if (editingUserId) {
        const request: UpdateUserRequest = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          organizationName: formData.organizationName.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        }
        if (formData.password.trim()) {
          request.password = formData.password
        }
        await userService.update(editingUserId, request)
        setSnackbar({ open: true, message: 'Usuario atualizado com sucesso.' })
      }

      handleCloseDialog()
      fetchData()
    } catch (err: unknown) {
      console.error('Error saving user:', err)
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormError(errorMessage || 'Erro ao salvar usuario. Tente novamente.')
    } finally {
      setFormLoading(false)
    }
  }

  // Handlers - activate/deactivate
  const handleToggleActive = async () => {
    if (!selectedUser) { handleMenuClose(); return }

    const isActive = selectedUser.active
    const action = isActive ? 'desativar' : 'ativar'

    const ok = await confirmDialog({
      title: `Confirmar ${action}`,
      message: `Tem certeza que deseja ${action} o usuario "${selectedUser.name}"?`,
      severity: isActive ? 'warning' : 'info',
      confirmText: isActive ? 'Desativar' : 'Ativar',
      cancelText: 'Cancelar',
    })

    if (ok) {
      try {
        if (isActive) {
          // Deactivate by updating active to false
          await userService.update(selectedUser.id, { name: selectedUser.name })
        } else {
          await userService.activate(selectedUser.id)
        }
        setSnackbar({ open: true, message: `Usuario ${isActive ? 'desativado' : 'ativado'} com sucesso.` })
        fetchData()
      } catch (err) {
        console.error(`Error ${action} user:`, err)
        setError(`Erro ao ${action} usuario.`)
      }
    }
    handleMenuClose()
  }

  // Handlers - delete
  const handleDelete = async () => {
    if (!selectedUser) { handleMenuClose(); return }

    const ok = await confirmDialog({
      title: 'Confirmar exclusao',
      message: `Tem certeza que deseja excluir o usuario "${selectedUser.name}"? Esta acao nao pode ser desfeita.`,
      severity: 'error',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    })

    if (ok) {
      try {
        await userService.delete(selectedUser.id)
        setSnackbar({ open: true, message: 'Usuario excluido com sucesso.' })
        fetchData()
      } catch (err) {
        console.error('Error deleting user:', err)
        setError('Erro ao excluir usuario.')
      }
    }
    handleMenuClose()
  }

  const headerCellSx = {
    fontWeight: 700,
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    color: 'text.secondary',
    letterSpacing: 0.5,
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Gestao de Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie os usuarios da plataforma
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Atualizar">
            <IconButton onClick={fetchData} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Novo Usuario
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={88} />
          ))
        ) : (
          <>
            <StatCard
              title="Total"
              value={stats.total}
              icon={PersonIcon}
              color="#3b82f6"
              bgColor="#eff6ff"
            />
            <StatCard
              title="Admin"
              value={stats.admin}
              icon={PersonIcon}
              color="#7c3aed"
              bgColor="#f5f3ff"
              onClick={() => { setFilterRole('ADMIN'); setPage(0) }}
            />
            <StatCard
              title="Corretora"
              value={stats.corretora}
              icon={PersonIcon}
              color="#9333ea"
              bgColor="#faf5ff"
              onClick={() => { setFilterRole('CORRETORA'); setPage(0) }}
            />
            <StatCard
              title="Administradora"
              value={stats.administradora}
              icon={PersonIcon}
              color="#16a34a"
              bgColor="#f0fdf4"
              onClick={() => { setFilterRole('ADMINISTRADORA'); setPage(0) }}
            />
            <StatCard
              title="Sindico"
              value={stats.sindico}
              icon={PersonIcon}
              color="#d97706"
              bgColor="#fffbeb"
              onClick={() => { setFilterRole('SINDICO'); setPage(0) }}
            />
          </>
        )}
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={handleSearchChange}
            sx={{ flex: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Perfil</InputLabel>
            <Select
              value={filterRole}
              label="Perfil"
              onChange={(e) => handleRoleFilterChange(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {ALL_ROLES.map(role => (
                <MenuItem key={role} value={role}>{getRoleLabel(role)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterActive}
              label="Status"
              onChange={(e) => handleActiveFilterChange(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="true">Ativo</MenuItem>
              <MenuItem value="false">Inativo</MenuItem>
            </Select>
          </FormControl>
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
                ? 'Nenhum usuario encontrado'
                : `${data.totalElements} usuario${data.totalElements !== 1 ? 's' : ''} encontrado${data.totalElements !== 1 ? 's' : ''}`
              }
              {(search || filterRole || filterActive) && (
                <> &bull; <Button
                  size="small"
                  sx={{ ml: 0.5, textTransform: 'none', p: 0, minWidth: 'auto' }}
                  onClick={() => { setSearch(''); setFilterRole(''); setFilterActive(''); setPage(0) }}
                >
                  Limpar filtros
                </Button></>
              )}
            </Typography>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Nome</TableCell>
                <TableCell sx={headerCellSx}>Email</TableCell>
                <TableCell sx={headerCellSx}>Perfil</TableCell>
                <TableCell sx={headerCellSx}>Organizacao</TableCell>
                <TableCell sx={headerCellSx} align="center">Status</TableCell>
                <TableCell sx={headerCellSx} align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={500}>
                      Nenhum usuario encontrado
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                      {search || filterRole || filterActive
                        ? 'Tente ajustar os filtros de busca'
                        : 'Cadastre o primeiro usuario para comecar'
                      }
                    </Typography>
                    {!search && !filterRole && !filterActive && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        sx={{ mt: 2 }}
                        onClick={handleOpenCreate}
                      >
                        Novo Usuario
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((userItem) => (
                  <TableRow
                    key={userItem.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#f8fafc' },
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            bgcolor: userItem.active ? '#eff6ff' : '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {userItem.active ? (
                            <PersonIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                          ) : (
                            <PersonOffIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
                          )}
                        </Box>
                        <Typography fontWeight={600} fontSize="0.875rem">
                          {userItem.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {userItem.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(userItem.role)}
                        size="small"
                        color={getRoleColor(userItem.role)}
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {userItem.organizationName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={userItem.active ? 'Ativo' : 'Inativo'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: userItem.active ? '#16a34a' : '#dc2626',
                          bgcolor: userItem.active ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${userItem.active ? '#16a34a' : '#dc2626'}20`,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, userItem)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
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
            labelRowsPerPage="Linhas por pagina:"
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
        <MenuItem onClick={handleOpenEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleToggleActive}>
          {selectedUser?.active ? (
            <>
              <PersonOffIcon fontSize="small" sx={{ mr: 1 }} />
              Desativar
            </>
          ) : (
            <>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              Ativar
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialogMode === 'create' ? 'Novo Usuario' : 'Editar Usuario'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {formError && (
              <Alert severity="error" onClose={() => setFormError(null)}>
                {formError}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Nome"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
              size="small"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              required
              size="small"
            />
            <TextField
              fullWidth
              label={dialogMode === 'create' ? 'Senha' : 'Nova Senha (deixe vazio para manter)'}
              type="password"
              value={formData.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              required={dialogMode === 'create'}
              size="small"
            />
            <FormControl fullWidth size="small" required>
              <InputLabel>Perfil</InputLabel>
              <Select
                value={formData.role}
                label="Perfil"
                onChange={(e) => handleFormChange('role', e.target.value)}
              >
                {ALL_ROLES.map(role => (
                  <MenuItem key={role} value={role}>{getRoleLabel(role)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Organizacao"
              value={formData.organizationName}
              onChange={(e) => handleFormChange('organizationName', e.target.value)}
              size="small"
              helperText="Nome da corretora, administradora ou condominio"
            />
            <TextField
              fullWidth
              label="Telefone"
              value={formData.phone}
              onChange={(e) => handleFormChange('phone', e.target.value)}
              size="small"
              placeholder="(00) 00000-0000"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            disabled={formLoading}
            sx={{
              borderColor: '#e2e8f0',
              color: 'text.secondary',
              '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={formLoading}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: 'none',
              '&:active': { boxShadow: 'none' },
            }}
          >
            {formLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              dialogMode === 'create' ? 'Criar Usuario' : 'Salvar Alteracoes'
            )}
          </Button>
        </DialogActions>
      </Dialog>

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
