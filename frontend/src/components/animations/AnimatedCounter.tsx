'use client'

import { Typography, TypographyProps } from '@mui/material'
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter'

interface AnimatedCounterProps extends Omit<TypographyProps, 'children'> {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  formatter?: (value: number) => string
}

export default function AnimatedCounter({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  formatter,
  ...typographyProps
}: AnimatedCounterProps) {
  const displayValue = useAnimatedCounter(value, duration)

  const formatted = formatter ? formatter(displayValue) : displayValue.toString()

  return (
    <Typography {...typographyProps}>
      {prefix}{formatted}{suffix}
    </Typography>
  )
}
