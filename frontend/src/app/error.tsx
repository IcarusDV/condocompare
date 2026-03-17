'use client'

import { useEffect } from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import HomeIcon from '@mui/icons-material/Home'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface RootErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

function isAuthError(error: Error): boolean {
  const message = (error.message || '').toLowerCase()
  const name = (error.name || '').toLowerCase()

  return (
    message.includes('unauthorized') ||
    message.includes('unauthenticated') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('token') ||
    message.includes('jwt') ||
    message.includes('session expired') ||
    message.includes('sessao expirada') ||
    message.includes('nao autorizado') ||
    name.includes('auth')
  )
}

function sanitizeErrorMessage(error: Error): string {
  const message = error.message || ''

  if (isAuthError(error)) {
    return 'Sua sessao expirou ou voce nao tem permissao. Redirecionando para o login...'
  }

  // Don't expose stack traces or internal details
  if (
    message.includes('at ') ||
    message.includes('Error:') ||
    message.includes('undefined') ||
    message.includes('null') ||
    message.length > 200
  ) {
    return 'Ocorreu um erro inesperado. Por favor, tente novamente.'
  }

  return message || 'Ocorreu um erro inesperado. Por favor, tente novamente.'
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error('Application error:', error)

    if (isAuthError(error)) {
      // Clear stored auth data
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      // Redirect to login after a short delay so the user sees the message
      const timeout = setTimeout(() => {
        window.location.href = '/login'
      }, 2000)

      return () => clearTimeout(timeout)
    }
  }, [error])

  const displayMessage = sanitizeErrorMessage(error)
  const authError = isAuthError(error)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        px: 3,
        bgcolor: '#f5f5f5',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            p: { xs: 4, sm: 6 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: authError ? 'warning.main' : 'error.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              opacity: 0.9,
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>

          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ mb: 1.5, color: '#0f172a' }}
          >
            {authError ? 'Sessao expirada' : 'Ops! Algo deu errado'}
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.7 }}
          >
            {displayMessage}
          </Typography>

          {!authError && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                justifyContent: 'center',
              }}
            >
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={reset}
                sx={{
                  bgcolor: '#3b82f6',
                  px: 3,
                  py: 1.2,
                  borderRadius: 1.5,
                  '&:hover': { bgcolor: '#2563eb' },
                }}
              >
                Tentar novamente
              </Button>

              <Button
                component={Link}
                href="/"
                variant="outlined"
                startIcon={<HomeIcon />}
                sx={{
                  px: 3,
                  py: 1.2,
                  borderRadius: 1.5,
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    bgcolor: '#f8fafc',
                  },
                }}
              >
                Voltar ao inicio
              </Button>
            </Box>
          )}

          {authError && (
            <Button
              component={Link}
              href="/login"
              variant="contained"
              sx={{
                bgcolor: '#3b82f6',
                px: 4,
                py: 1.2,
                borderRadius: 1.5,
                '&:hover': { bgcolor: '#2563eb' },
              }}
            >
              Ir para o Login
            </Button>
          )}
        </Paper>
      </motion.div>
    </Box>
  )
}
