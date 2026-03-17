'use client'

import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import AssignmentIcon from '@mui/icons-material/Assignment'
import DescriptionIcon from '@mui/icons-material/Description'
import NotificationsIcon from '@mui/icons-material/Notifications'
import ApartmentIcon from '@mui/icons-material/Apartment'
import { ActivityEvent } from '@/types'

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  sinistro: {
    icon: <ReportProblemIcon sx={{ fontSize: 18 }} />,
    color: '#ef4444',
    bg: '#fef2f2',
  },
  vistoria: {
    icon: <AssignmentIcon sx={{ fontSize: 18 }} />,
    color: '#22c55e',
    bg: '#f0fdf4',
  },
  documento: {
    icon: <DescriptionIcon sx={{ fontSize: 18 }} />,
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  notificacao: {
    icon: <NotificationsIcon sx={{ fontSize: 18 }} />,
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  condominio: {
    icon: <ApartmentIcon sx={{ fontSize: 18 }} />,
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `Ha ${diffMin}min`
  if (diffHours < 24) return `Ha ${diffHours}h`
  if (diffDays < 7) return `Ha ${diffDays}d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

interface Props {
  events: ActivityEvent[]
}

export default function ActivityFeed({ events }: Props) {
  if (events.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Nenhuma atividade recente
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Vertical line */}
      <Box
        sx={{
          position: 'absolute',
          left: 19,
          top: 20,
          bottom: 20,
          width: 2,
          bgcolor: '#e2e8f0',
          borderRadius: 1,
        }}
      />

      {events.map((event, index) => {
        const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.documento

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                py: 1.5,
                px: 0.5,
                position: 'relative',
                '&:hover': { bgcolor: '#f8fafc', borderRadius: 1 },
                transition: 'background-color 0.15s',
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: config.bg,
                  color: config.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 1,
                  border: '2px solid white',
                }}
              >
                {config.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {event.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
                    {formatRelativeTime(event.timestamp)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {event.description}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )
      })}
    </Box>
  )
}
