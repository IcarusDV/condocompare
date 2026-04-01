'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  Badge,
} from '@mui/material'
import ApartmentIcon from '@mui/icons-material/Apartment'
import CompareIcon from '@mui/icons-material/Compare'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import DescriptionIcon from '@mui/icons-material/Description'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import GroupsIcon from '@mui/icons-material/Groups'
import AssignmentIcon from '@mui/icons-material/Assignment'
import SummarizeIcon from '@mui/icons-material/Summarize'
import BusinessIcon from '@mui/icons-material/Business'
import PeopleIcon from '@mui/icons-material/People'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useNotificationCount } from '@/hooks/useNotificationCount'

const DRAWER_WIDTH = 260
const DRAWER_WIDTH_COLLAPSED = 72

const menuItems = [
  { title: 'Dashboard', icon: DashboardIcon, href: '/dashboard' },
  { title: 'Condomínios', icon: ApartmentIcon, href: '/dashboard/condominios' },
  { title: 'Comparar Orçamentos', icon: CompareIcon, href: '/dashboard/comparar' },
  { title: 'Vistorias', icon: AssignmentIcon, href: '/dashboard/vistorias' },
  { title: 'Sinistros', icon: ReportProblemIcon, href: '/dashboard/sinistros' },
  { title: 'Documentos', icon: DescriptionIcon, href: '/dashboard/documentos' },
  { title: 'Diagnóstico', icon: AnalyticsIcon, href: '/dashboard/diagnostico' },
  { title: 'Parceiros', icon: GroupsIcon, href: '/dashboard/parceiros' },
  { title: 'Relatórios', icon: SummarizeIcon, href: '/dashboard/relatorios' },
  { title: 'Assistente IA', icon: SmartToyIcon, href: '/dashboard/assistente' },
  { title: 'Seguradoras', icon: BusinessIcon, href: '/dashboard/seguradoras' },
  { title: 'Usuários', icon: PeopleIcon, href: '/dashboard/usuarios', adminOnly: true },
]

const roleLabels: Record<string, { label: string; color: 'primary' | 'secondary' | 'success' | 'warning' }> = {
  ADMIN: { label: 'Admin', color: 'primary' },
  CORRETORA: { label: 'Corretora', color: 'secondary' },
  ADMINISTRADORA: { label: 'Adm', color: 'success' },
  SINDICO: { label: 'Síndico', color: 'warning' },
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useThemeMode()
  const router = useRouter()
  const pathname = usePathname()
  const { count: notificationCount } = useNotificationCount()

  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH
  const roleInfo = user ? roleLabels[user.role] || { label: user.role, color: 'primary' as const } : null

  // Sidebar colors: in light mode keep the dark sidebar; in dark mode use a slightly lighter shade
  const sidebarBg = isDark ? '#1a2332' : '#0f172a'
  const sidebarDivider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.1)'
  const sidebarHoverBg = 'rgba(255,255,255,0.05)'
  const sidebarUserBg = 'rgba(255,255,255,0.05)'
  const textMuted = 'rgba(255,255,255,0.8)'
  const textDimmed = 'rgba(255,255,255,0.6)'
  const iconMuted = 'rgba(255,255,255,0.7)'

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: sidebarBg,
          color: 'white',
          borderRight: 'none',
          transition: 'width 0.2s ease-in-out, background-color 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          p: 2,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#60a5fa' }}>
            CondoCompare
          </Typography>
        )}
        {collapsed && (
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#60a5fa' }}>
            CC
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Notificações" arrow>
            <IconButton
              onClick={() => router.push('/dashboard/notificacoes')}
              sx={{ color: iconMuted, '&:hover': { color: 'white' } }}
              size="small"
            >
              <Badge
                badgeContent={notificationCount}
                color="error"
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.65rem',
                    height: 18,
                    minWidth: 18,
                    ...(notificationCount > 0 && {
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { transform: 'scale(1) translate(50%, -50%)' },
                        '50%': { transform: 'scale(1.1) translate(50%, -50%)' },
                      },
                    }),
                  },
                }}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            sx={{ color: iconMuted, '&:hover': { color: 'white' } }}
            size="small"
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ borderColor: sidebarDivider }} />

      {/* User Info */}
      {user && (
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: sidebarUserBg,
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: '#3b82f6',
                fontSize: '1rem',
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            {!collapsed && (
              <Box sx={{ overflow: 'hidden' }}>
                <Typography
                  variant="body2"
                  fontWeight="600"
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.name}
                </Typography>
                <Chip
                  label={roleInfo?.label}
                  size="small"
                  color={roleInfo?.color}
                  sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }}
                />
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: sidebarDivider }} />

      {/* Menu Items */}
      <List role="navigation" aria-label="Menu principal" sx={{ px: 1, py: 2, flex: 1 }}>
        {menuItems.filter(item => !item.adminOnly || user?.role === 'ADMIN').map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
          return (
            <Tooltip
              key={item.href}
              title={collapsed ? item.title : ''}
              placement="right"
              arrow
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => router.push(item.href)}
                  aria-current={isActive ? 'page' : undefined}
                  sx={{
                    borderRadius: 2,
                    minHeight: 44,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1.5 : 2,
                    bgcolor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(59, 130, 246, 0.3)' : sidebarHoverBg,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : 40,
                      color: isActive ? '#60a5fa' : textDimmed,
                    }}
                  >
                    <item.icon fontSize="small" />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? 'white' : textMuted,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          )
        })}
      </List>

      <Divider sx={{ borderColor: sidebarDivider }} />

      {/* Bottom Actions */}
      <List sx={{ px: 1, py: 1 }}>
        {/* Configurações */}
        <Tooltip title={collapsed ? 'Configurações' : ''} placement="right" arrow>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => router.push('/dashboard/configuracoes')}
              sx={{
                borderRadius: 2,
                minHeight: 44,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1.5 : 2,
                bgcolor: pathname === '/dashboard/configuracoes' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                borderLeft: pathname === '/dashboard/configuracoes' ? '3px solid #3b82f6' : '3px solid transparent',
                '&:hover': {
                  bgcolor: pathname === '/dashboard/configuracoes' ? 'rgba(59, 130, 246, 0.3)' : sidebarHoverBg,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: pathname === '/dashboard/configuracoes' ? '#60a5fa' : textDimmed }}>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Configurações"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: pathname === '/dashboard/configuracoes' ? 600 : 400,
                    color: pathname === '/dashboard/configuracoes' ? 'white' : textMuted,
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        </Tooltip>

        {/* Sair */}
        <Tooltip title={collapsed ? 'Sair' : ''} placement="right" arrow>
          <ListItem disablePadding>
            <ListItemButton
              onClick={logout}
              sx={{
                borderRadius: 2,
                minHeight: 44,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1.5 : 2,
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: '#ef4444' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Sair"
                  primaryTypographyProps={{ fontSize: '0.875rem', color: '#ef4444' }}
                />
              )}
            </ListItemButton>
          </ListItem>
        </Tooltip>
      </List>
    </Drawer>
  )
}
