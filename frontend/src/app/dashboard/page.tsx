'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardMetrics, useDashboardCharts, dashboardKeys } from '@/hooks/queries/useDashboard'
import { ApoliceVencendoDTO } from '@/types'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Chip,
  Button,
  Skeleton,
  Tooltip,
  IconButton,
} from '@mui/material'
import { motion } from 'framer-motion'
import ApartmentIcon from '@mui/icons-material/Apartment'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AssignmentIcon from '@mui/icons-material/Assignment'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleIcon from '@mui/icons-material/Schedule'
import RefreshIcon from '@mui/icons-material/Refresh'
import ShieldIcon from '@mui/icons-material/Shield'
import TimelineIcon from '@mui/icons-material/Timeline'
import AnimatedCounter from '@/components/animations/AnimatedCounter'
import MotionCard from '@/components/animations/MotionCard'

const SinistrosDonutChart = dynamic(() => import('@/components/dashboard/SinistrosDonutChart'), { ssr: false })
const VistoriasTimelineChart = dynamic(() => import('@/components/dashboard/VistoriasTimelineChart'), { ssr: false })
const SeguradorasBarChart = dynamic(() => import('@/components/dashboard/SeguradorasBarChart'), { ssr: false })

const getGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: metrics, isLoading: loading, error: metricsError } = useDashboardMetrics()
  const { data: chartData, isLoading: chartsLoading } = useDashboardCharts()

  const error = metricsError ? 'Erro ao carregar métricas' : null

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
  }, [queryClient])

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const getDiasColor = (dias: number) => {
    if (dias <= 7) return { color: '#ef4444', bg: '#fee2e2' }
    if (dias <= 15) return { color: '#f59e0b', bg: '#fef3c7' }
    if (dias <= 30) return { color: '#3b82f6', bg: '#dbeafe' }
    return { color: '#22c55e', bg: '#dcfce7' }
  }

  // ─── Loading ─────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} animation="wave" />
        <Skeleton variant="text" width={400} height={24} sx={{ mb: 2 }} animation="wave" />
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" width={140} height={36} animation="wave" />)}
        </Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={6} md={3} key={i}><Skeleton variant="rounded" height={100} animation="wave" /></Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={260} animation="wave" /></Grid>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={260} animation="wave" /></Grid>
        </Grid>
      </Box>
    )
  }

  const vistoriasTotal = (metrics?.vistoriasAgendadas || 0) + (metrics?.vistoriasConcluidas || 0)
  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* ─── Header ─────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" fontWeight="bold">
              {getGreeting()}, {user?.name?.split(' ')[0]}!
            </Typography>
            <Chip
              label={user?.role === 'ADMIN' ? 'Admin' : user?.role === 'CORRETORA' ? 'Corretora' : user?.role === 'ADMINISTRADORA' ? 'Adm.' : 'Síndico'}
              size="small"
              sx={{ fontSize: '0.65rem', fontWeight: 600, height: 20, bgcolor: '#f1f5f9', color: '#64748b' }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
        </motion.div>
        <Tooltip title="Atualizar dados">
          <IconButton size="small" onClick={handleRefresh} sx={{ border: '1px solid #e2e8f0' }}>
            <RefreshIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ─── Alerts ─────────────────────────────────────── */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ─── Quick Actions ──────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {[
          { label: 'Novo Condomínio', icon: <ApartmentIcon sx={{ fontSize: 16 }} />, href: '/dashboard/condominios/novo', color: '#3b82f6' },
          { label: 'Nova Vistoria', icon: <AssignmentIcon sx={{ fontSize: 16 }} />, href: '/dashboard/vistorias', color: '#10b981' },
          { label: 'Comparar Orçamentos', icon: <CompareArrowsIcon sx={{ fontSize: 16 }} />, href: '/dashboard/comparar', color: '#6366f1' },
          { label: 'Assistente IA', icon: <SmartToyIcon sx={{ fontSize: 16 }} />, href: '/dashboard/assistente', color: '#f59e0b' },
          { label: 'Sinistros', icon: <ReportProblemIcon sx={{ fontSize: 16 }} />, href: '/dashboard/sinistros', color: '#ef4444' },
        ].map((action) => (
          <Chip
            key={action.label}
            icon={action.icon}
            label={action.label}
            onClick={() => router.push(action.href)}
            sx={{
              bgcolor: `${action.color}12`,
              color: action.color,
              fontWeight: 600,
              fontSize: '0.8rem',
              border: `1px solid ${action.color}30`,
              '&:hover': { bgcolor: `${action.color}22` },
              '& .MuiChip-icon': { color: action.color },
              cursor: 'pointer',
              py: 2,
            }}
          />
        ))}
      </Box>

      {/* ─── Stats Row (unica) ──────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Condomínios', value: metrics?.totalCondominios || 0, sub: `${metrics?.totalApolices || 0} apólices`, icon: <ApartmentIcon />, color: '#3b82f6', href: '/dashboard/condominios' },
          { title: 'Sinistros', value: (metrics?.sinistrosAbertos || 0) + (metrics?.sinistrosEmAnalise || 0), sub: `${metrics?.sinistrosEmAnalise || 0} em análise`, icon: <ReportProblemIcon />, color: (metrics?.sinistrosAbertos || 0) > 0 ? '#ef4444' : '#10b981', href: '/dashboard/sinistros' },
          { title: 'Vistorias', value: vistoriasTotal, sub: `${metrics?.vistoriasAgendadas || 0} agendadas`, icon: <AssignmentIcon />, color: '#10b981', href: '/dashboard/vistorias' },
        ].map((stat, idx) => (
          <Grid item xs={6} md={4} key={stat.title}>
            <MotionCard
              delay={idx * 0.06}
              onClick={() => router.push(stat.href)}
              sx={{
                p: 2, border: '1px solid #e2e8f0', boxShadow: 'none', cursor: 'pointer',
                '&:hover': { borderColor: stat.color },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                  {stat.title}
                </Typography>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                  {stat.icon}
                </Box>
              </Box>
              <AnimatedCounter value={stat.value} variant="h4" fontWeight="bold" sx={{ lineHeight: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{stat.sub}</Typography>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* ─── Main Content ──────────────────────────────── */}
      <Grid container spacing={3}>
        {/* Main Column */}
        <Grid item xs={12}>
          {/* Charts 2x2 */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Sinistros por Status</Typography>
                {chartsLoading ? <Skeleton variant="rounded" height={220} animation="wave" /> : (
                  <SinistrosDonutChart data={chartData?.sinistrosByStatus || []} />
                )}
              </Paper>
            </Grid>
            {user?.role === 'CORRETORA' && (<Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <TimelineIcon sx={{ color: '#3b82f6', fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight="bold">Vistorias (12 meses)</Typography>
                </Box>
                {chartsLoading ? <Skeleton variant="rounded" height={220} animation="wave" /> : (
                  <VistoriasTimelineChart data={chartData?.vistoriasByMonth || []} />
                )}
              </Paper>
            </Grid>)}
            {user?.role === 'CORRETORA' && (<Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Seguradoras</Typography>
                {chartsLoading ? <Skeleton variant="rounded" height={220} animation="wave" /> : (
                  <SeguradorasBarChart data={chartData?.topSeguradoras || []} />
                )}
              </Paper>
            </Grid>)}
          </Grid>

          {/* Apólices Vencendo */}
          <Paper sx={{ p: 2.5, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight="bold">Apólices Vencendo</Typography>
                {(metrics?.apolicesVencendo30dias || 0) > 0 && (
                  <Chip label={metrics?.apolicesVencendo30dias} size="small" sx={{ bgcolor: '#fef3c7', color: '#f59e0b', fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                )}
              </Box>
              <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />} onClick={() => router.push('/dashboard/documentos')} sx={{ color: '#6366f1', fontSize: '0.75rem' }}>
                Ver Todas
              </Button>
            </Box>
            {(!metrics?.proximasApolicesVencer || metrics.proximasApolicesVencer.length === 0) ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircleIcon sx={{ fontSize: 36, color: '#22c55e', mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary" display="block">Nenhuma apólice vencendo nos próximos 30 dias</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {metrics.proximasApolicesVencer.slice(0, 5).map((apolice: ApoliceVencendoDTO, idx: number) => {
                  const diasColors = getDiasColor(apolice.diasParaVencer)
                  return (
                    <motion.div key={apolice.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 2, py: 1.5, borderRadius: 1.5, bgcolor: '#fafbfc', border: '1px solid #f1f5f9',
                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#e2e8f0' }, transition: 'all 0.15s',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: `${diasColors.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldIcon sx={{ fontSize: 16, color: diasColors.color }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>{apolice.condominioNome}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {apolice.seguradoraNome || 'Seguradora não informada'} - Vence em {new Date(apolice.dataVencimento).toLocaleDateString('pt-BR')}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          icon={<ScheduleIcon sx={{ fontSize: 12 }} />}
                          label={`${apolice.diasParaVencer}d`}
                          size="small"
                          sx={{ bgcolor: diasColors.bg, color: diasColors.color, fontWeight: 700, fontSize: '0.7rem', height: 24, '& .MuiChip-icon': { color: diasColors.color } }}
                        />
                      </Box>
                    </motion.div>
                  )
                })}
              </Box>
            )}
          </Paper>

          {/* Financial Summary (CORRETORA) */}
          {user?.role === 'CORRETORA' && (
            <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AttachMoneyIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight="bold">Resumo de Sinistros</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 160, p: 1.5, borderRadius: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                    <TrendingDownIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.65rem' }}>PREJUÍZOS</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#ef4444', lineHeight: 1.2 }}>
                    {formatCurrency(metrics?.valorTotalPrejuizos)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 160, p: 1.5, borderRadius: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                    <AttachMoneyIcon sx={{ fontSize: 14, color: '#22c55e' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.65rem' }}>INDENIZADO</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#22c55e', lineHeight: 1.2 }}>
                    {formatCurrency(metrics?.valorTotalIndenizado)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Financial Summary (non-CORRETORA) */}
          {user?.role !== 'CORRETORA' && (metrics?.valorTotalPrejuizos || 0) > 0 && (
            <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AttachMoneyIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight="bold">Valor Total dos Prejuízos</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <TrendingDownIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#ef4444' }}>
                  {formatCurrency(metrics?.valorTotalPrejuizos)}
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>

      </Grid>
    </Box>
  )
}
