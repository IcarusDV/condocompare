'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import BusinessIcon from '@mui/icons-material/Business'
import LockIcon from '@mui/icons-material/Lock'
import SaveIcon from '@mui/icons-material/Save'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

const roleLabels: Record<string, { label: string; color: 'primary' | 'secondary' | 'success' | 'warning' }> = {
  ADMIN: { label: 'Administrador', color: 'primary' },
  CORRETORA: { label: 'Corretora', color: 'secondary' },
  ADMINISTRADORA: { label: 'Administradora', color: 'success' },
  SINDICO: { label: 'Síndico', color: 'warning' },
}

export default function PerfilPage() {
  const { user } = useAuth()

  // Profile form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Preferences state
  const [notificacoesEmail, setNotificacoesEmail] = useState(true)
  const [notificacoesPush, setNotificacoesPush] = useState(true)
  const [idioma, setIdioma] = useState('pt-BR')

  // Feedback state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setOrganizationName(user.organizationName || '')
    }
  }, [user])

  const roleInfo = user ? roleLabels[user.role] || { label: user.role, color: 'primary' as const } : null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSaveProfile = async () => {
    try {
      setProfileLoading(true)
      await api.put('/users/me', {
        name,
        organizationName,
      })

      // Update stored user data
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        userData.name = name
        userData.organizationName = organizationName
        localStorage.setItem('user', JSON.stringify(userData))
      }

      setSnackbar({ open: true, message: 'Perfil atualizado com sucesso!', severity: 'success' })
    } catch (err: unknown) {
      console.error('Error updating profile:', err)
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erro ao atualizar perfil'
          : 'Erro ao atualizar perfil'
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setSnackbar({ open: true, message: 'As senhas não coincidem', severity: 'error' })
      return
    }

    if (newPassword.length < 6) {
      setSnackbar({ open: true, message: 'A nova senha deve ter pelo menos 6 caracteres', severity: 'error' })
      return
    }

    try {
      setPasswordLoading(true)
      await api.put('/users/me/password', {
        currentPassword,
        newPassword,
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSnackbar({ open: true, message: 'Senha alterada com sucesso!', severity: 'success' })
    } catch (err: unknown) {
      console.error('Error changing password:', err)
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erro ao alterar senha'
          : 'Erro ao alterar senha'
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Meu Perfil
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie suas informações pessoais, senha e preferências
        </Typography>
      </Box>

      {/* User Info Card */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: '#3b82f6',
              fontSize: '1.75rem',
              fontWeight: 'bold',
            }}
          >
            {getInitials(user.name)}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {user.email}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={roleInfo?.label}
                color={roleInfo?.color}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              {user.organizationName && (
                <Chip
                  icon={<BusinessIcon sx={{ fontSize: '0.875rem !important' }} />}
                  label={user.organizationName}
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Edit Profile Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Editar Perfil
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Email"
            value={email}
            fullWidth
            disabled
            helperText="O email não pode ser alterado"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Organização"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            fullWidth
            placeholder="Nome da sua organização"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={profileLoading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveProfile}
              disabled={profileLoading || !name.trim()}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Salvar Alterações
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Change Password Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Alterar Senha
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Senha Atual"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                    size="small"
                  >
                    {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Nova Senha"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            helperText="Mínimo de 6 caracteres"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                    size="small"
                  >
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirmar Nova Senha"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            error={confirmPassword.length > 0 && newPassword !== confirmPassword}
            helperText={confirmPassword.length > 0 && newPassword !== confirmPassword ? 'As senhas não coincidem' : ''}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={passwordLoading ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
              onClick={handleChangePassword}
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Alterar Senha
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Preferences Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Preferências
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Notificações
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificacoesEmail}
                    onChange={(e) => setNotificacoesEmail(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Notificações por email</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receba alertas de vencimento de apólice e atualizações por email
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificacoesPush}
                    onChange={(e) => setNotificacoesPush(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Notificações push</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receba notificações em tempo real no navegador
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Idioma
            </Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Idioma</InputLabel>
              <Select
                value={idioma}
                label="Idioma"
                onChange={(e) => setIdioma(e.target.value)}
              >
                <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
                <MenuItem value="en-US" disabled>
                  English (em breve)
                </MenuItem>
                <MenuItem value="es" disabled>
                  Español (em breve)
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Alert severity="info" sx={{ mt: 1 }}>
            As preferências de notificação e idioma estarão disponíveis em breve.
          </Alert>
        </Box>
      </Paper>

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
