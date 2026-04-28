import type { Metadata } from 'next'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { Providers } from './providers'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://condocompare.com.br'),
  title: 'CondoCompare - Gestao Inteligente de Seguro Condominio',
  description: 'Plataforma para analise e contratacao de seguro condominio com inteligencia artificial',
  keywords: ['seguro condominio', 'comparar orcamentos', 'apolice', 'sinistro', 'vistoria'],
  authors: [{ name: 'CondoCompare' }],
  icons: {
    icon: '/icon.svg',
  },
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
