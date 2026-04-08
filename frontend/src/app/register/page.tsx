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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from '@mui/material'
import Link from 'next/link'
import { motion } from 'framer-motion'
import ShieldIcon from '@mui/icons-material/Shield'
import ApartmentIcon from '@mui/icons-material/Apartment'
import DescriptionIcon from '@mui/icons-material/Description'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'

const roles = [
  { value: 'CORRETORA', label: 'Corretora', description: 'Acesso completo a todos condomínios' },
  { value: 'ADMINISTRADORA', label: 'Administradora', description: 'Gerencie condomínios que administra' },
  { value: 'SINDICO', label: 'Síndico', description: 'Visão exclusiva do seu condomínio' },
]

const highlights = [
  {
    icon: <ApartmentIcon sx={{ fontSize: 22 }} />,
    title: 'Gerencie Condominios',
    text: 'Cadastre e acompanhe todos os seus condominios em um so lugar',
  },
  {
    icon: <DescriptionIcon sx={{ fontSize: 22 }} />,
    title: 'Analise com IA',
    text: 'Importe documentos e deixe a inteligencia artificial trabalhar por voce',
  },
  {
    icon: <GroupsIcon sx={{ fontSize: 22 }} />,
    title: 'Colabore em Equipe',
    text: 'Convide sua equipe e trabalhe de forma colaborativa',
  },
]

const benefits = [
  'Gratis para ate 5 condominios',
  'Sem necessidade de cartao',
  'Configuracao em minutos',
  'Suporte por email incluso',
]

export default function RegisterPage() {
  const { register } = useAuth()
  const { isDark } = useThemeMode()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    organizationName: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name as string]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem')
      return
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter no minimo 8 caracteres')
      return
    }

    setIsLoading(true)

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organizationName: formData.organizationName,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate form completion for visual feedback
  const filledFields = [formData.name, formData.email, formData.role, formData.password, formData.confirmPassword].filter(Boolean).length
  const activeStep = Math.min(Math.floor(filledFields / 2), 2)

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
          width: '48%',
          background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 60%, #0f172a 100%)',
          color: 'white',
          px: { md: 5, lg: 7 },
          py: 5,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
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
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              bgcolor: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 6,
              px: 1.5,
              py: 0.4,
              mb: 3,
            }}
          >
            <RocketLaunchIcon sx={{ fontSize: 14, color: '#22c55e' }} />
            <Typography variant="caption" sx={{ color: '#86efac', fontWeight: 500, fontSize: '0.72rem' }}>
              Comece gratis hoje
            </Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#f1f5f9',
              fontSize: { md: '1.6rem', lg: '1.9rem' },
              letterSpacing: '-0.02em',
            }}
          >
            Crie sua conta e comece a{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(90deg, #818cf8, #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              transformar
            </Box>
            {' '}a gestao de seguros
          </Typography>

          <Typography variant="body2" sx={{ mb: 5, color: '#94a3b8', lineHeight: 1.7, fontSize: '0.88rem' }}>
            Junte-se a centenas de profissionais que ja usam o CondoCompare para simplificar seu trabalho.
          </Typography>

          <Stack spacing={3}>
            {highlights.map((item, i) => (
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
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#e2e8f0', fontWeight: 700, mb: 0.3 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', lineHeight: 1.5 }}>
                      {item.text}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Bottom - Benefits */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2.5 }} />
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {benefits.map((b, i) => (
              <Chip
                key={i}
                icon={<CheckCircleIcon sx={{ fontSize: 14, color: '#22c55e !important' }} />}
                label={b}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.68rem',
                }}
              />
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
          px: { xs: 3, sm: 5 },
          py: 3,
          bgcolor: isDark ? 'background.default' : '#fafbfc',
          overflow: 'auto',
          transition: 'background-color 0.3s ease',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile logo */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1,
              mb: 3,
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

          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', letterSpacing: '-0.02em', fontSize: '1.6rem' }}
            >
              Crie sua conta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Preencha os dados para começar a usar o CondoCompare
            </Typography>
          </Box>

          {/* Progress stepper */}
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {['Dados pessoais', 'Perfil', 'Senha'].map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': { fontSize: '0.7rem', mt: 0.5 },
                    '& .MuiStepIcon-root.Mui-active': { color: '#6366f1' },
                    '& .MuiStepIcon-root.Mui-completed': { color: '#22c55e' },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Name + Email row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.3, display: 'block' }}>
                  Nome completo
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Seu nome"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoFocus
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.3, display: 'block' }}>
                  Email
                </Typography>
                <TextField
                  fullWidth
                  placeholder="seu@email.com"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                    },
                  }}
                />
              </Box>
            </Stack>

            {/* Role + Org row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.3, display: 'block' }}>
                  Perfil
                </Typography>
                <FormControl
                  fullWidth
                  required
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                    },
                  }}
                >
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={(e) => handleChange(e as any)}
                    displayEmpty
                    renderValue={(value) => {
                      if (!value) return <Typography sx={{ color: 'text.disabled', fontSize: '0.875rem' }}>Selecione</Typography>
                      return roles.find((r) => r.value === value)?.label || value
                    }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {role.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {role.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.3, display: 'block' }}>
                  Organizacao
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Nome da empresa"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessOutlinedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                    },
                  }}
                />
              </Box>
            </Stack>

            {/* Password row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 0.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.3, display: 'block' }}>
                  Senha
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Min. 8 caracteres"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.3, display: 'block' }}>
                  Confirmar senha
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Repita a senha"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                          {showConfirmPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                    },
                  }}
                />
              </Box>
            </Stack>

            {/* Password strength indicator */}
            {formData.password && (
              <Box sx={{ mb: 1 }}>
                <Stack direction="row" spacing={0.5}>
                  {[1, 2, 3, 4].map((level) => (
                    <Box
                      key={level}
                      sx={{
                        flex: 1,
                        height: 3,
                        borderRadius: 2,
                        bgcolor:
                          formData.password.length >= level * 3
                            ? formData.password.length >= 12
                              ? '#22c55e'
                              : formData.password.length >= 8
                              ? '#f59e0b'
                              : '#ef4444'
                            : isDark
                            ? 'rgba(255,255,255,0.1)'
                            : '#e2e8f0',
                        transition: 'background-color 0.3s ease',
                      }}
                    />
                  ))}
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                  {formData.password.length < 8
                    ? 'Senha fraca — minimo 8 caracteres'
                    : formData.password.length < 12
                    ? 'Senha razoavel'
                    : 'Senha forte'}
                </Typography>
              </Box>
            )}

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                endIcon={!isLoading && <ArrowForwardIcon />}
                sx={{
                  mt: 2,
                  py: 1.5,
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
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Criar Conta Gratis'}
              </Button>
            </motion.div>
          </Box>

          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', px: 1 }}>
              ou
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Ja tem uma conta?{' '}
              <MuiLink
                component={Link}
                href="/login"
                sx={{ fontWeight: 700, color: '#6366f1', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Fazer login
              </MuiLink>
            </Typography>
          </Box>

          {/* Back to home */}
          <Box sx={{ textAlign: 'center', mt: 1.5 }}>
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
