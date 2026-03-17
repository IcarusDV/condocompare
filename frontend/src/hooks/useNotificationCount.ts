'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { notificacaoService } from '@/services/notificacaoService'

export function useNotificationCount(intervalMs: number = 30000) {
  const [count, setCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const refresh = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const result = await notificacaoService.countNaoLidas()
      setCount(result)
    } catch {
      // silently fail - not critical
    }
  }, [])

  useEffect(() => {
    refresh()

    intervalRef.current = setInterval(refresh, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [refresh, intervalMs])

  return { count, refresh }
}
