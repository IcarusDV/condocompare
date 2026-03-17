'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ConfirmDialogProvider } from '@/contexts/ConfirmDialogContext'
import { SnackbarProvider } from '@/contexts/SnackbarContext'
import { ThemeModeProvider } from '@/contexts/ThemeContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <AuthProvider>
          <SnackbarProvider>
            <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
          </SnackbarProvider>
        </AuthProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  )
}
