'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  Stack,
} from '@mui/material'
import Link from 'next/link'
import { motion } from 'framer-motion'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ShieldIcon from '@mui/icons-material/Shield'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await api.post('/v1/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao processar solicitacao')
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          sx={{ textAlign: 'center', p: 4, maxWidth: 420 }}
        >
          <CheckCircleIcon sx={{ fontSize: 64, color: '#22c55e', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Email enviado!</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Se o email <strong>{email}</strong> estiver cadastrado, voce recebera um link para redefinir sua senha.
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 3 }}>
            Verifique tambem a pasta de spam.
          </Typography>
          <Button component={Link} href="/login" variant="outlined" sx={{ borderColor: '#6366f1', color: '#6366f1', borderRadius: 2.5 }}>
            Voltar ao Login
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
          Esqueceu a senha?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Informe seu email e enviaremos um link para redefinir sua senha
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            placeholder="seu@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            InputProps={{
              startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} /></InputAdornment>,
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
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Enviar link de redefinicao'}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            component={Link}
            href="/login"
            startIcon={<ArrowBackIcon />}
            sx={{ color: 'text.secondary', textTransform: 'none', '&:hover': { color: '#6366f1' } }}
          >
            Voltar ao login
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
