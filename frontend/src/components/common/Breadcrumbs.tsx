'use client'

import { usePathname } from 'next/navigation'
import NextLink from 'next/link'
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
} from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import HomeIcon from '@mui/icons-material/Home'

const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  condominios: 'Condominios',
  documentos: 'Documentos',
  sinistros: 'Sinistros',
  vistorias: 'Vistorias',
  comparar: 'Comparar Orcamentos',
  diagnostico: 'Diagnostico',
  parceiros: 'Parceiros',
  relatorios: 'Relatorios',
  assistente: 'Assistente IA',
  seguradoras: 'Seguradoras',
  notificacoes: 'Notificacoes',
  perfil: 'Meu Perfil',
  novo: 'Novo',
  editar: 'Editar',
  planos: 'Planos',
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getSegmentLabel(segment: string): string {
  if (UUID_REGEX.test(segment)) {
    return 'Detalhes'
  }
  return segmentLabels[segment] || segment
}

export function Breadcrumbs() {
  const pathname = usePathname()

  if (!pathname || pathname === '/dashboard') {
    return null
  }

  const segments = pathname.split('/').filter(Boolean)

  // Build breadcrumb items from segments
  const items = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = getSegmentLabel(segment)
    const isLast = index === segments.length - 1

    return { href, label, isLast }
  })

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs
        aria-label="Navegacao"
        separator={<NavigateNextIcon sx={{ fontSize: 16, color: '#94a3b8' }} />}
        sx={{
          '& .MuiBreadcrumbs-ol': {
            alignItems: 'center',
          },
        }}
      >
        {items.map((item, index) => {
          if (item.isLast) {
            return (
              <Typography
                key={item.href}
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                }}
              >
                {item.label}
              </Typography>
            )
          }

          return (
            <Link
              key={item.href}
              component={NextLink}
              href={item.href}
              underline="hover"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: '#94a3b8',
                fontSize: '0.8125rem',
                fontWeight: 400,
                '&:hover': {
                  color: '#3b82f6',
                },
                transition: 'color 0.15s ease',
              }}
            >
              {index === 0 && (
                <HomeIcon sx={{ fontSize: 16 }} />
              )}
              {item.label}
            </Link>
          )
        })}
      </MuiBreadcrumbs>
    </Box>
  )
}
