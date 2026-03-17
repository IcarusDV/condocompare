'use client'

import { Box, Typography } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { StatusCount } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  ABERTO: '#f59e0b',
  EM_ANALISE: '#3b82f6',
  APROVADO: '#8b5cf6',
  NEGADO: '#ef4444',
  PAGO: '#22c55e',
  CANCELADO: '#94a3b8',
}

const STATUS_LABELS: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ANALISE: 'Em Analise',
  APROVADO: 'Aprovado',
  NEGADO: 'Negado',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
}

interface Props {
  data: StatusCount[]
}

export default function SinistrosDonutChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <Typography variant="body2" color="text.secondary">Sem dados</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height: 240, position: 'relative' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="count"
            nameKey="status"
          >
            {data.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [value, STATUS_LABELS[name] || name]}
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={700} color="text.primary">
          {total}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Total
        </Typography>
      </Box>
    </Box>
  )
}
