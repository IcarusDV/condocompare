'use client'

import { Box, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TipoCount } from '@/types'

const TIPO_COLORS: Record<string, string> = {
  APOLICE: '#3b82f6',
  ORCAMENTO: '#8b5cf6',
  CONDICOES_GERAIS: '#06b6d4',
  LAUDO_VISTORIA: '#10b981',
  SINISTRO: '#ef4444',
  OUTRO: '#94a3b8',
}

const TIPO_LABELS: Record<string, string> = {
  APOLICE: 'Apólice',
  ORCAMENTO: 'Orçamento',
  CONDICOES_GERAIS: 'Cond. Gerais',
  LAUDO_VISTORIA: 'Laudo',
  SINISTRO: 'Sinistro',
  OUTRO: 'Outro',
}

interface Props {
  data: TipoCount[]
}

export default function DocumentosByTypeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <Typography variant="body2" color="text.secondary">Sem dados</Typography>
      </Box>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    label: TIPO_LABELS[d.tipo] || d.tipo,
  }))

  return (
    <Box sx={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Quantidade">
            {chartData.map((entry) => (
              <Cell key={entry.tipo} fill={TIPO_COLORS[entry.tipo] || '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
