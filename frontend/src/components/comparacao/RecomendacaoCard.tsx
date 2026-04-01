'use client'

import { Box, Paper, Typography, Chip } from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import SecurityIcon from '@mui/icons-material/Security'
import StarIcon from '@mui/icons-material/Star'
import { RecomendacaoComparacaoDTO } from '@/types'

interface RecomendacaoCardProps {
  recomendacao: RecomendacaoComparacaoDTO
}

const getRecomendacaoInfo = (tipo: RecomendacaoComparacaoDTO['tipo']) => {
  switch (tipo) {
    case 'MENOR_PRECO':
      return {
        icon: <AttachMoneyIcon />,
        color: '#22c55e',
        bgColor: '#dcfce7',
        label: 'Menor Preço',
      }
    case 'MAIOR_COBERTURA':
      return {
        icon: <SecurityIcon />,
        color: '#3b82f6',
        bgColor: '#dbeafe',
        label: 'Maior Cobertura',
      }
    case 'MELHOR_CUSTO_BENEFICIO':
      return {
        icon: <StarIcon />,
        color: '#f59e0b',
        bgColor: '#fef3c7',
        label: 'Melhor Custo-Benefício',
      }
    default:
      return {
        icon: <EmojiEventsIcon />,
        color: '#6b7280',
        bgColor: '#f3f4f6',
        label: tipo,
      }
  }
}

export function RecomendacaoCard({ recomendacao }: RecomendacaoCardProps) {
  const info = getRecomendacaoInfo(recomendacao.tipo)

  return (
    <Paper
      sx={{
        p: 2,
        borderLeft: 4,
        borderColor: info.color,
        bgcolor: info.bgColor,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 1,
            bgcolor: info.color,
            color: 'white',
            display: 'flex',
          }}
        >
          {info.icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {info.label}
            </Typography>
            <Chip
              label={recomendacao.seguradora}
              size="small"
              sx={{ bgcolor: 'white' }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {recomendacao.justificativa}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}
