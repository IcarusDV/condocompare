'use client'

import { motion } from 'framer-motion'
import { Paper, PaperProps } from '@mui/material'
import { ReactNode } from 'react'

interface MotionCardProps extends PaperProps {
  children: ReactNode
  hoverY?: number
  delay?: number
}

export default function MotionCard({
  children,
  hoverY = -4,
  delay = 0,
  sx,
  ...paperProps
}: MotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: hoverY }}
      style={{ height: '100%' }}
    >
      <Paper
        sx={{
          height: '100%',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
          },
          ...sx,
        }}
        {...paperProps}
      >
        {children}
      </Paper>
    </motion.div>
  )
}
