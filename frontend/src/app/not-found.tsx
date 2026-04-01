'use client'

import { Box, Typography, Button, Paper } from '@mui/material'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import DashboardIcon from '@mui/icons-material/Dashboard'
import HomeIcon from '@mui/icons-material/Home'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function NotFound() {
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
          {/* 404 illustration */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '5rem', sm: '6rem' },
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a5f 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                }}
              >
                404
              </Typography>
            </Box>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
              }}
            >
              <SearchOffIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
            </Box>
          </Box>

          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ mb: 1.5, color: '#0f172a' }}
          >
            Página não encontrada
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.7 }}
          >
            A página que você está procurando não existe ou foi movida para outro
            endereço.
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
              component={Link}
              href="/dashboard"
              variant="contained"
              startIcon={<DashboardIcon />}
              sx={{
                bgcolor: '#3b82f6',
                px: 3,
                py: 1.2,
                borderRadius: 1.5,
                '&:hover': { bgcolor: '#2563eb' },
              }}
            >
              Ir ao Dashboard
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
        </Paper>
      </motion.div>
    </Box>
  )
}
