'use client'

import { useEffect } from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import DashboardIcon from '@mui/icons-material/Dashboard'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

function sanitizeErrorMessage(error: Error): string {
  const message = error.message || ''

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

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Log the error for debugging/monitoring
    console.error('Dashboard error:', error)
  }, [error])

  const displayMessage = sanitizeErrorMessage(error)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        px: 3,
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
              bgcolor: 'error.main',
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
            Ops! Algo deu errado
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.7 }}
          >
            {displayMessage}
          </Typography>

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
              href="/dashboard"
              variant="outlined"
              startIcon={<DashboardIcon />}
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
              Voltar ao Dashboard
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  )
}
