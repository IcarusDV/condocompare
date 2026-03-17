'use client'

import { useMemo, useCallback } from 'react'
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
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material'
import { motion } from 'framer-motion'
import ApartmentIcon from '@mui/icons-material/Apartment'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AddBusinessIcon from '@mui/icons-material/AddBusiness'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import FolderIcon from '@mui/icons-material/Folder'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleIcon from '@mui/icons-material/Schedule'
import RefreshIcon from '@mui/icons-material/Refresh'
import ShieldIcon from '@mui/icons-material/Shield'
import TimelineIcon from '@mui/icons-material/Timeline'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import WarningIcon from '@mui/icons-material/Warning'
import NotificationsIcon from '@mui/icons-material/Notifications'
import AnimatedCounter from '@/components/animations/AnimatedCounter'
import MotionCard from '@/components/animations/MotionCard'
import ActivityFeed from '@/components/dashboard/ActivityFeed'

// Dynamic imports for recharts (avoid SSR issues)
const SinistrosDonutChart = dynamic(() => import('@/components/dashboard/SinistrosDonutChart'), { ssr: false })
const DocumentosByTypeChart = dynamic(() => import('@/components/dashboard/DocumentosByTypeChart'), { ssr: false })
const VistoriasTimelineChart = dynamic(() => import('@/components/dashboard/VistoriasTimelineChart'), { ssr: false })
const SeguradorasBarChart = dynamic(() => import('@/components/dashboard/SeguradorasBarChart'), { ssr: false })

interface AIInsight {
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
}

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

  const error = metricsError ? 'Erro ao carregar metricas' : null

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
  }, [queryClient])

  const aiInsights = useMemo<AIInsight[]>(() => {
    if (!metrics) return []
    const insights: AIInsight[] = []

    if (metrics.apolicesVencendo30dias > 0) {
      insights.push({ type: 'warning', message: `${metrics.apolicesVencendo30dias} apolice(s) vencendo nos proximos 30 dias. Solicite novos orcamentos.` })
    }
    if (metrics.sinistrosAbertos > 0) {
      insights.push({ type: 'error', message: `${metrics.sinistrosAbertos} sinistro(s) aberto(s) aguardando acao. Acompanhe os prazos.` })
    }
    if (metrics.sinistrosEmAnalise > 0) {
      insights.push({ type: 'info', message: `${metrics.sinistrosEmAnalise} sinistro(s) em analise pelas seguradoras.` })
    }
    if (metrics.notificacoesNaoLidas > 0) {
      insights.push({ type: 'info', message: `Voce tem ${metrics.notificacoesNaoLidas} notificacao(oes) nao lida(s).` })
    }
    if (insights.length === 0) {
      insights.push({ type: 'success', message: 'Tudo em ordem! Condominios com coberturas adequadas e documentacao em dia.' })
    }
    return insights
  }, [metrics])

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'success': return <CheckCircleIcon sx={{ fontSize: 18 }} />
      case 'warning': return <WarningAmberIcon sx={{ fontSize: 18 }} />
      case 'error': return <ReportProblemIcon sx={{ fontSize: 18 }} />
      default: return <TipsAndUpdatesIcon sx={{ fontSize: 18 }} />
    }
  }

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'success': return { bg: '#f0fdf4', border: '#22c55e', text: '#166534' }
      case 'warning': return { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' }
      case 'error': return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' }
      default: return { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }
    }
  }

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

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} animation="wave" />
        <Skeleton variant="text" width={400} height={24} sx={{ mb: 3 }} animation="wave" />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={6} md={3} key={i}><Skeleton variant="rounded" height={110} animation="wave" /></Grid>
          ))}
        </Grid>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3].map(i => (
            <Grid item xs={4} key={i}><Skeleton variant="rounded" height={70} animation="wave" /></Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={280} animation="wave" /></Grid>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={280} animation="wave" /></Grid>
        </Grid>
      </Box>
    )
  }

  const vistoriasTotal = (metrics?.vistoriasAgendadas || 0) + (metrics?.vistoriasConcluidas || 0)
  const vistoriasProgress = vistoriasTotal > 0 ? ((metrics?.vistoriasConcluidas || 0) / vistoriasTotal) * 100 : 0
  const coberturaPercentual = metrics?.valorTotalPrejuizos && metrics.valorTotalPrejuizos > 0
    ? ((metrics.valorTotalIndenizado || 0) / metrics.valorTotalPrejuizos) * 100
    : 0

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Typography variant="h4" fontWeight="bold">
            {getGreeting()}, {user?.name?.split(' ')[0]}!
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Typography>
            <Chip
              label={user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'CORRETORA' ? 'Corretora' : user?.role === 'ADMINISTRADORA' ? 'Administradora' : 'Sindico'}
              size="small"
              sx={{ fontSize: '0.7rem', fontWeight: 600, height: 22, bgcolor: '#f1f5f9', color: '#64748b' }}
            />
          </Box>
        </motion.div>
        <Tooltip title="Atualizar dados">
          <IconButton onClick={handleRefresh} sx={{ border: '1px solid #e2e8f0' }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Date Range Indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
        <CalendarTodayIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
          Dados dos ultimos 12 meses
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Alerts */}
      {aiInsights.length > 0 && aiInsights[0].type !== 'success' && (
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {aiInsights.filter(i => i.type !== 'success').map((insight, idx) => {
            const colors = getInsightColor(insight.type)
            return (
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
                <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: colors.bg, border: `1px solid ${colors.border}30`, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: colors.border }}>{getInsightIcon(insight.type)}</Box>
                  <Typography variant="body2" sx={{ color: colors.text, fontSize: '0.8rem' }}>{insight.message}</Typography>
                </Box>
              </motion.div>
            )
          })}
        </Box>
      )}

      {/* Main Stats Row - with AnimatedCounter */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Condominios', value: metrics?.totalCondominios || 0, sub: `${metrics?.totalApolices || 0} apolices`, icon: <ApartmentIcon />, color: '#3b82f6', href: '/dashboard/condominios', trend: '+12%' },
          { title: 'Apolices Vencendo', value: metrics?.apolicesVencendo30dias || 0, sub: 'Proximos 30 dias', icon: <WarningAmberIcon />, color: (metrics?.apolicesVencendo30dias || 0) > 0 ? '#f59e0b' : '#10b981', href: '/dashboard/documentos', trend: '-5%' },
          { title: 'Vistorias', value: vistoriasTotal, sub: `${metrics?.vistoriasAgendadas || 0} agendadas`, icon: <AssignmentIcon />, color: '#10b981', href: '/dashboard/vistorias', trend: '+8%' },
          { title: 'Sinistros Abertos', value: (metrics?.sinistrosAbertos || 0) + (metrics?.sinistrosEmAnalise || 0), sub: `${metrics?.sinistrosEmAnalise || 0} em analise`, icon: <ReportProblemIcon />, color: (metrics?.sinistrosAbertos || 0) > 0 ? '#ef4444' : '#10b981', href: '/dashboard/sinistros', trend: '-3%' },
        ].map((stat, idx) => (
          <Grid item xs={6} md={3} key={stat.title}>
            <MotionCard
              delay={idx * 0.08}
              onClick={() => router.push(stat.href)}
              sx={{
                p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', cursor: 'pointer',
                '&:hover': { borderColor: stat.color },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {stat.title}
                </Typography>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                  {stat.icon}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <AnimatedCounter value={stat.value} variant="h4" fontWeight="bold" sx={{ lineHeight: 1.1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <TrendingUpIcon sx={{ fontSize: 14, color: stat.trend.startsWith('+') ? '#16a34a' : '#dc2626' }} />
                  <Typography variant="caption" sx={{ color: stat.trend.startsWith('+') ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: '0.7rem' }}>
                    {stat.trend}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">{stat.sub}</Typography>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Apolices Vencendo em 30 dias', value: metrics?.apolicesVencendo30dias || 0, icon: <WarningIcon sx={{ fontSize: 16 }} />, color: '#d97706', urgent: (metrics?.apolicesVencendo30dias || 0) > 0 },
          { label: 'Sinistros em Analise', value: metrics?.sinistrosEmAnalise || 0, icon: <ScheduleIcon sx={{ fontSize: 16 }} />, color: '#dc2626', urgent: (metrics?.sinistrosEmAnalise || 0) > 0 },
          { label: 'Vistorias Agendadas', value: metrics?.vistoriasAgendadas || 0, icon: <AssignmentIcon sx={{ fontSize: 16 }} />, color: '#16a34a', urgent: false },
          { label: 'Notificacoes Nao Lidas', value: metrics?.notificacoesNaoLidas || 0, icon: <NotificationsIcon sx={{ fontSize: 16 }} />, color: '#3b82f6', urgent: (metrics?.notificacoesNaoLidas || 0) > 0 },
        ].map((kpi, idx) => (
          <Grid item xs={6} md={3} key={kpi.label}>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + idx * 0.06 }}>
              <Paper
                sx={{
                  px: 2, py: 1.5, border: '1px solid #e2e8f0', boxShadow: 'none',
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  ...(kpi.urgent && { borderColor: `${kpi.color}40`, bgcolor: `${kpi.color}05` }),
                }}
              >
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: `${kpi.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, flexShrink: 0 }}>
                  {kpi.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.1, color: kpi.urgent ? kpi.color : 'text.primary' }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', lineHeight: 1.2 }} noWrap>
                    {kpi.label}
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Secondary Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Documentos', value: metrics?.totalDocumentos || 0, icon: <FolderIcon sx={{ fontSize: 18 }} />, color: '#8b5cf6' },
          { title: 'Orcamentos', value: metrics?.totalOrcamentos || 0, icon: <RequestQuoteIcon sx={{ fontSize: 18 }} />, color: '#06b6d4' },
          { title: 'Notificacoes', value: metrics?.notificacoesNaoLidas || 0, icon: <NotificationsActiveIcon sx={{ fontSize: 18 }} />, color: (metrics?.notificacoesNaoLidas || 0) > 0 ? '#f59e0b' : '#94a3b8', href: '/dashboard/notificacoes' },
        ].map((stat, idx) => (
          <Grid item xs={4} key={stat.title}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + idx * 0.08 }}>
              <Paper
                onClick={() => stat.href ? router.push(stat.href) : undefined}
                sx={{
                  p: 2, border: '1px solid #e2e8f0', boxShadow: 'none',
                  cursor: stat.href ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 2,
                  transition: 'all 0.2s', '&:hover': stat.href ? { borderColor: stat.color, bgcolor: `${stat.color}05` } : {},
                }}
              >
                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                  {stat.icon}
                </Box>
                <Box>
                  <AnimatedCounter value={stat.value} variant="h6" fontWeight="bold" sx={{ lineHeight: 1.1 }} />
                  <Typography variant="caption" color="text.secondary">{stat.title}</Typography>
                </Box>
                {stat.title === 'Notificacoes' && (metrics?.notificacoesNaoLidas || 0) > 0 && (
                  <Chip label="Novas" size="small" sx={{ ml: 'auto', bgcolor: '#fef3c7', color: '#f59e0b', fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
                )}
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Paper sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Sinistros por Status</Typography>
              {chartsLoading ? (
                <Skeleton variant="rounded" height={240} animation="wave" />
              ) : (
                <SinistrosDonutChart data={chartData?.sinistrosByStatus || []} />
              )}
            </Paper>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Paper sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Documentos por Tipo</Typography>
              {chartsLoading ? (
                <Skeleton variant="rounded" height={240} animation="wave" />
              ) : (
                <DocumentosByTypeChart data={chartData?.documentosByTipo || []} />
              )}
            </Paper>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Paper sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimelineIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight="bold">Vistorias - Ultimos 12 Meses</Typography>
              </Box>
              {chartsLoading ? (
                <Skeleton variant="rounded" height={240} animation="wave" />
              ) : (
                <VistoriasTimelineChart data={chartData?.vistoriasByMonth || []} />
              )}
            </Paper>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Paper sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Top Seguradoras</Typography>
              {chartsLoading ? (
                <Skeleton variant="rounded" height={240} animation="wave" />
              ) : (
                <SeguradorasBarChart data={chartData?.topSeguradoras || []} />
              )}
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Apolices Vencendo */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="subtitle1" fontWeight="bold">Apolices Vencendo</Typography>
                {(metrics?.apolicesVencendo30dias || 0) > 0 && (
                  <Chip label={metrics?.apolicesVencendo30dias} size="small" sx={{ bgcolor: '#fef3c7', color: '#f59e0b', fontWeight: 700, height: 22 }} />
                )}
              </Box>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push('/dashboard/documentos')} sx={{ color: '#6366f1' }}>
                Ver Todas
              </Button>
            </Box>
            {(!metrics?.proximasApolicesVencer || metrics.proximasApolicesVencer.length === 0) ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: '#22c55e', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Nenhuma apolice vencendo nos proximos 30 dias</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {metrics.proximasApolicesVencer.slice(0, 5).map((apolice: ApoliceVencendoDTO, idx: number) => {
                  const diasColors = getDiasColor(apolice.diasParaVencer)
                  return (
                    <motion.div key={apolice.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        p: 2, borderRadius: 2, bgcolor: '#fafbfc', border: '1px solid #f1f5f9',
                        transition: 'all 0.15s', '&:hover': { bgcolor: '#f8fafc', borderColor: '#e2e8f0' },
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: `${diasColors.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldIcon sx={{ fontSize: 18, color: diasColors.color }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{apolice.condominioNome}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {apolice.seguradoraNome || 'Seguradora nao informada'} - Vence em {new Date(apolice.dataVencimento).toLocaleDateString('pt-BR')}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                          label={`${apolice.diasParaVencer}d`}
                          size="small"
                          sx={{ bgcolor: diasColors.bg, color: diasColors.color, fontWeight: 700, fontSize: '0.75rem', height: 26, '& .MuiChip-icon': { color: diasColors.color } }}
                        />
                      </Box>
                    </motion.div>
                  )
                })}
              </Box>
            )}
          </Paper>

          {/* Financial Summary */}
          <Paper sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AttachMoneyIcon sx={{ color: '#6366f1' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {user?.role === 'CORRETORA' ? 'Resumo Financeiro de Sinistros' : 'Valor Total dos Prejuizos'}
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={user?.role === 'CORRETORA' ? 6 : 12}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <TrendingDownIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL PREJUIZOS</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#ef4444' }}>
                    {formatCurrency(metrics?.valorTotalPrejuizos)}
                  </Typography>
                </Box>
              </Grid>
              {user?.role === 'CORRETORA' && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <AttachMoneyIcon sx={{ fontSize: 16, color: '#22c55e' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL INDENIZADO</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#22c55e' }}>
                      {formatCurrency(metrics?.valorTotalIndenizado)}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {user?.role === 'CORRETORA' && (metrics?.valorTotalPrejuizos || 0) > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>
                      Cobertura: {coberturaPercentual.toFixed(1)}%
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(coberturaPercentual, 100)}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#fee2e2', '& .MuiLinearProgress-bar': { bgcolor: '#22c55e', borderRadius: 4 } }}
                      />
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Acoes Rapidas</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: 'Novo Condominio', icon: <AddBusinessIcon sx={{ fontSize: 20 }} />, color: '#3b82f6', href: '/dashboard/condominios/novo', roles: ['ADMIN', 'CORRETORA', 'ADMINISTRADORA'] },
                { label: 'Nova Vistoria', icon: <AssignmentIcon sx={{ fontSize: 20 }} />, color: '#10b981', href: '/dashboard/vistorias', roles: ['ADMIN', 'CORRETORA', 'ADMINISTRADORA'] },
                { label: 'Comparar Orcamentos', icon: <CompareArrowsIcon sx={{ fontSize: 20 }} />, color: '#8b5cf6', href: '/dashboard/comparar', roles: ['ADMIN', 'CORRETORA', 'ADMINISTRADORA'] },
                { label: 'Assistente IA', icon: <AutoAwesomeIcon sx={{ fontSize: 20 }} />, color: '#f59e0b', href: '/dashboard/assistente', roles: ['ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO'] },
                { label: 'Sinistros', icon: <ReportProblemIcon sx={{ fontSize: 20 }} />, color: '#ef4444', href: '/dashboard/sinistros', roles: ['ADMIN', 'CORRETORA'] },
                { label: 'Meu Condominio', icon: <ApartmentIcon sx={{ fontSize: 20 }} />, color: '#3b82f6', href: '/dashboard/condominios', roles: ['SINDICO'] },
              ].filter(action => action.roles.includes(user?.role || '')).map((action) => (
                <Box
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                    borderRadius: 2, cursor: 'pointer', border: '1px solid #f1f5f9',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: `${action.color}08`, borderColor: `${action.color}40`, transform: 'translateX(4px)' },
                  }}
                >
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${action.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color }}>
                    {action.icon}
                  </Box>
                  <Typography variant="body2" fontWeight={500}>{action.label}</Typography>
                  <ArrowForwardIcon sx={{ fontSize: 16, color: '#94a3b8', ml: 'auto' }} />
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Activity Feed */}
          <Paper sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Atividade Recente</Typography>
            {chartsLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={48} animation="wave" />)}
              </Box>
            ) : (
              <ActivityFeed events={chartData?.recentActivity || []} />
            )}
          </Paper>

          {/* AI Insights */}
          <Paper sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: 'none', background: 'linear-gradient(135deg, #667eea05 0%, #764ba205 100%)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToyIcon sx={{ color: '#6366f1' }} />
                <Typography variant="subtitle1" fontWeight="bold">Insights</Typography>
              </Box>
              <Button size="small" onClick={() => router.push('/dashboard/diagnostico')} sx={{ color: '#6366f1', minWidth: 'auto' }}>
                Diagnostico
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {aiInsights.map((insight, idx) => {
                const colors = getInsightColor(insight.type)
                return (
                  <motion.div key={idx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + idx * 0.1 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: colors.bg, borderLeft: `3px solid ${colors.border}`, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ color: colors.border, mt: 0.2 }}>{getInsightIcon(insight.type)}</Box>
                      <Typography variant="caption" sx={{ color: colors.text, lineHeight: 1.5 }}>{insight.message}</Typography>
                    </Box>
                  </motion.div>
                )
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
