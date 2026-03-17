'use client'

import { Box, Typography } from '@mui/material'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { MonthCount } from '@/types'

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
}

interface Props {
  data: MonthCount[]
}

export default function VistoriasTimelineChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <Typography variant="body2" color="text.secondary">Sem dados</Typography>
      </Box>
    )
  }

  const chartData = data.map((d) => {
    const monthPart = d.month.split('-')[1]
    return {
      ...d,
      label: MONTH_LABELS[monthPart] || monthPart,
    }
  })

  return (
    <Box sx={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="vistoriaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#vistoriaGradient)"
            name="Vistorias"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}
