'use client'

import { Box, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { SeguradoraCount } from '@/types'

interface Props {
  data: SeguradoraCount[]
}

export default function SeguradorasBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <Typography variant="body2" color="text.secondary">Sem dados</Typography>
      </Box>
    )
  }

  const chartData = data.slice(0, 8).map((d) => ({
    ...d,
    label: d.seguradora.length > 15 ? d.seguradora.substring(0, 15) + '...' : d.seguradora,
  }))

  return (
    <Box sx={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [value, 'Condominios']}
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="condominios" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Condominios" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
