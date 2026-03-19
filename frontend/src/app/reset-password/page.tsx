'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Stack,
} from '@mui/material'
import Link from 'next/link'
import { motion } from 'framer-motion'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ShieldIcon from '@mui/icons-material/Shield'
import { api } from '@/lib/api'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/v1/auth/reset-password', { token, newPassword: password })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao redefinir senha. O link pode ter expirado.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>Link invalido. Solicite uma nova redefinicao de senha.</Alert>
          <Button component={Link} href="/login" variant="contained" sx={{ bgcolor: '#6366f1' }}>
            Voltar ao Login
          </Button>
        </Box>
      </Box>
    )
  }

  if (success) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          sx={{ textAlign: 'center', p: 4, maxWidth: 400 }}
        >
          <CheckCircleIcon sx={{ fontSize: 64, color: '#22c55e', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Senha redefinida!</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sua senha foi alterada com sucesso. Faca login com a nova senha.
          </Typography>
          <Button component={Link} href="/login" variant="contained" size="large" sx={{ bgcolor: '#6366f1', borderRadius: 2.5, px: 4 }}>
            Ir para o Login
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ width: '100%', maxWidth: 420, p: 4 }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4, justifyContent: 'center' }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2.5, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldIcon sx={{ fontSize: 24, color: '#fff' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>CondoCompare</Typography>
        </Stack>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
          Nova Senha
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Digite sua nova senha abaixo
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            placeholder="Nova senha (min. 8 caracteres)"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOffIcon sx={{ fontSize: 20 }} /> : <VisibilityIcon sx={{ fontSize: 20 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          />

          <TextField
            fullWidth
            placeholder="Confirmar nova senha"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} /></InputAdornment>,
            }}
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ py: 1.5, borderRadius: 2.5, bgcolor: '#6366f1', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#4f46e5' } }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Redefinir Senha'}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography
            component={Link}
            href="/login"
            variant="body2"
            sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: '#6366f1' } }}
          >
            Voltar ao login
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
