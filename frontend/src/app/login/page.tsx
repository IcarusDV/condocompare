'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Link as MuiLink,
  CircularProgress,
  Stack,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material'
import Link from 'next/link'
import { motion } from 'framer-motion'
import ShieldIcon from '@mui/icons-material/Shield'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import InsightsIcon from '@mui/icons-material/Insights'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import SecurityIcon from '@mui/icons-material/Security'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

const features = [
  {
    icon: <CompareArrowsIcon sx={{ fontSize: 22 }} />,
    title: 'Compare Orcamentos',
    text: 'Comparacao inteligente lado a lado com ranking automatico',
  },
  {
    icon: <InsightsIcon sx={{ fontSize: 22 }} />,
    title: 'Diagnóstico Técnico',
    text: 'Score de cobertura e recomendações personalizadas',
  },
  {
    icon: <SmartToyIcon sx={{ fontSize: 22 }} />,
    title: 'Assistente IA',
    text: 'Respostas instantaneas sobre coberturas e franquias',
  },
]

const trustBadges = [
  { icon: <VerifiedUserIcon sx={{ fontSize: 16 }} />, label: 'Dados seguros' },
  { icon: <SecurityIcon sx={{ fontSize: 16 }} />, label: 'Criptografia' },
  { icon: <TrendingUpIcon sx={{ fontSize: 16 }} />, label: '99.9% uptime' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const { isDark } = useThemeMode()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Email ou senha invalidos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left decorative panel */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '55%',
          background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)',
          color: 'white',
          px: { md: 6, lg: 8 },
          py: 5,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -150,
            right: -150,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            right: 0,
            width: 1,
            height: '40%',
            transform: 'translateY(-50%)',
            background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.2) 50%, transparent 100%)',
          }}
        />

        {/* Top - Logo */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(99,102,241,0.3)',
              }}
            >
              <ShieldIcon sx={{ fontSize: 26, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                CondoCompare
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Middle - Content */}
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 460 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              bgcolor: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 6,
              px: 1.5,
              py: 0.4,
              mb: 3,
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e' }} />
            <Typography variant="caption" sx={{ color: '#c7d2fe', fontWeight: 500, fontSize: '0.72rem' }}>
              Plataforma CondoCompare
            </Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#f1f5f9',
              fontSize: { md: '1.75rem', lg: '2.1rem' },
              letterSpacing: '-0.02em',
            }}
          >
            Simplifique a gestao do seguro{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(90deg, #818cf8, #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              condominial
            </Box>
          </Typography>

          <Typography variant="body2" sx={{ mb: 5, color: '#94a3b8', lineHeight: 1.7, fontSize: '0.9rem' }}>
            Tecnologia e expertise para corretoras, administradoras e sindicos gerenciarem seguros com eficiencia.
          </Typography>

          <Stack spacing={3}>
            {features.map((feature, i) => (
              <Box
                key={i}
                component={motion.div}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.12 }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(99,102,241,0.12)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8',
                      flexShrink: 0,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#e2e8f0', fontWeight: 700, mb: 0.3 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', lineHeight: 1.5 }}>
                      {feature.text}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Bottom - Trust badges */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2.5 }} />
          <Stack direction="row" spacing={3}>
            {trustBadges.map((badge, i) => (
              <Stack key={i} direction="row" spacing={0.7} alignItems="center">
                <Box sx={{ color: '#6366f1', display: 'flex' }}>{badge.icon}</Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                  {badge.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Right form panel */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 6 },
          py: 4,
          bgcolor: isDark ? 'background.default' : '#fafbfc',
          transition: 'background-color 0.3s ease',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1,
              mb: 4,
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, color: 'text.primary', fontSize: '1rem' }}>
                CondoCompare
              </Typography>
            </Box>
          </Box>

          {/* Welcome text */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', letterSpacing: '-0.02em' }}
            >
              Bem-vindo de volta
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Acesse sua conta para continuar
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, display: 'block' }}>
              Email
            </Typography>
            <TextField
              fullWidth
              placeholder="seu@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                },
              }}
            />

            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, display: 'block' }}>
              Senha
            </Typography>
            <TextField
              fullWidth
              placeholder="Digite sua senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOffIcon sx={{ fontSize: 20 }} />
                      ) : (
                        <VisibilityIcon sx={{ fontSize: 20 }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Typography
                component={Link}
                href="/forgot-password"
                variant="caption"
                sx={{
                  color: '#6366f1',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Esqueceu a senha?
              </Typography>
            </Box>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                endIcon={!isLoading && <ArrowForwardIcon />}
                sx={{
                  py: 1.6,
                  borderRadius: 2.5,
                  bgcolor: '#6366f1',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.25)',
                  '&:hover': {
                    bgcolor: '#4f46e5',
                    boxShadow: '0 6px 25px rgba(99,102,241,0.35)',
                  },
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
              </Button>
            </motion.div>
          </Box>

          <Divider sx={{ my: 3.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', px: 1 }}>
              ou
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nao tem uma conta?{' '}
              <MuiLink
                component={Link}
                href="/register"
                sx={{ fontWeight: 700, color: '#6366f1', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Criar conta gratis
              </MuiLink>
            </Typography>
          </Box>

          {/* Back to home */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink
              component={Link}
              href="/"
              sx={{
                fontSize: '0.8rem',
                color: 'text.disabled',
                textDecoration: 'none',
                '&:hover': { color: '#6366f1' },
              }}
            >
              Voltar ao site
            </MuiLink>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
