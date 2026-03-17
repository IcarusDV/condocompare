import type { Metadata } from 'next'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'CondoCompare - Gestao Inteligente de Seguro Condominio',
  description: 'Plataforma para analise e contratacao de seguro condominio com inteligencia artificial',
  keywords: ['seguro condominio', 'comparar orcamentos', 'apolice', 'sinistro', 'vistoria'],
  authors: [{ name: 'CondoCompare' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
