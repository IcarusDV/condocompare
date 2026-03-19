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
import AnimatedCounter from '@/components/animations/AnimatedCounter'
import MotionCard from '@/components/animations/MotionCard'
import ActivityFeed from '@/components/dashboard/ActivityFeed'

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
  const coberturaPercentual = metrics?.valorTotalPrejuizos && metrics.valorTotalPrejuizos > 0
    ? ((metrics.valorTotalIndenizado || 0) / metrics.valorTotalPrejuizos) * 100
    : 0

  // ─── Quick Actions config ───────────────────────────────

  const quickActions = [
    { label: 'Novo Condominio', icon: <AddBusinessIcon sx={{ fontSize: 18 }} />, color: '#3b82f6', href: '/dashboard/condominios/novo', roles: ['ADMIN', 'CORRETORA', 'ADMINISTRADORA'] },
    { label: 'Nova Vistoria', icon: <AssignmentIcon sx={{ fontSize: 18 }} />, color: '#10b981', href: '/dashboard/vistorias', roles: ['ADMIN', 'CORRETORA', 'ADMINISTRADORA'] },
    { label: 'Comparar Orcamentos', icon: <CompareArrowsIcon sx={{ fontSize: 18 }} />, color: '#8b5cf6', href: '/dashboard/comparar', roles: ['ADMIN', 'CORRETORA', 'ADMINISTRADORA'] },
    { label: 'Assistente IA', icon: <AutoAwesomeIcon sx={{ fontSize: 18 }} />, color: '#f59e0b', href: '/dashboard/assistente', roles: ['ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO'] },
    { label: 'Sinistros', icon: <ReportProblemIcon sx={{ fontSize: 18 }} />, color: '#ef4444', href: '/dashboard/sinistros', roles: ['ADMIN', 'CORRETORA'] },
    { label: 'Meu Condominio', icon: <ApartmentIcon sx={{ fontSize: 18 }} />, color: '#3b82f6', href: '/dashboard/condominios', roles: ['SINDICO'] },
  ].filter(a => a.roles.includes(user?.role || ''))

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
              label={user?.role === 'ADMIN' ? 'Admin' : user?.role === 'CORRETORA' ? 'Corretora' : user?.role === 'ADMINISTRADORA' ? 'Adm.' : 'Sindico'}
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

      {/* ─── Quick Actions (horizontal, no topo) ────────── */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {quickActions.map((action, idx) => (
          <motion.div key={action.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <Chip
              icon={action.icon as React.ReactElement}
              label={action.label}
              onClick={() => router.push(action.href)}
              sx={{
                cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
                bgcolor: `${action.color}08`, color: action.color,
                border: `1px solid ${action.color}25`,
                '& .MuiChip-icon': { color: action.color },
                '&:hover': { bgcolor: `${action.color}15`, borderColor: action.color },
                transition: 'all 0.15s',
              }}
            />
          </motion.div>
        ))}
      </Box>

      {/* ─── Alerts ─────────────────────────────────────── */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {aiInsights.length > 0 && aiInsights[0].type !== 'success' && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {aiInsights.filter(i => i.type !== 'success').map((insight, idx) => {
            const colors = getInsightColor(insight.type)
            return (
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
                <Box sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, bgcolor: colors.bg, border: `1px solid ${colors.border}30`, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ color: colors.border }}>{getInsightIcon(insight.type)}</Box>
                  <Typography variant="caption" sx={{ color: colors.text, fontWeight: 500 }}>{insight.message}</Typography>
                </Box>
              </motion.div>
            )
          })}
        </Box>
      )}

      {/* ─── Stats Row (unica) ──────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Condominios', value: metrics?.totalCondominios || 0, sub: `${metrics?.totalApolices || 0} apolices`, icon: <ApartmentIcon />, color: '#3b82f6', href: '/dashboard/condominios' },
          { title: 'Apolices Vencendo', value: metrics?.apolicesVencendo30dias || 0, sub: 'Proximos 30 dias', icon: <WarningAmberIcon />, color: (metrics?.apolicesVencendo30dias || 0) > 0 ? '#f59e0b' : '#10b981', href: '/dashboard/documentos' },
          { title: 'Sinistros', value: (metrics?.sinistrosAbertos || 0) + (metrics?.sinistrosEmAnalise || 0), sub: `${metrics?.sinistrosEmAnalise || 0} em analise`, icon: <ReportProblemIcon />, color: (metrics?.sinistrosAbertos || 0) > 0 ? '#ef4444' : '#10b981', href: '/dashboard/sinistros' },
          { title: 'Vistorias', value: vistoriasTotal, sub: `${metrics?.vistoriasAgendadas || 0} agendadas`, icon: <AssignmentIcon />, color: '#10b981', href: '/dashboard/vistorias' },
        ].map((stat, idx) => (
          <Grid item xs={6} md={3} key={stat.title}>
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

      {/* ─── Main Content (2 columns) ───────────────────── */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
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
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Documentos por Tipo</Typography>
                {chartsLoading ? <Skeleton variant="rounded" height={220} animation="wave" /> : (
                  <DocumentosByTypeChart data={chartData?.documentosByTipo || []} />
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <TimelineIcon sx={{ color: '#3b82f6', fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight="bold">Vistorias (12 meses)</Typography>
                </Box>
                {chartsLoading ? <Skeleton variant="rounded" height={220} animation="wave" /> : (
                  <VistoriasTimelineChart data={chartData?.vistoriasByMonth || []} />
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Top Seguradoras</Typography>
                {chartsLoading ? <Skeleton variant="rounded" height={220} animation="wave" /> : (
                  <SeguradorasBarChart data={chartData?.topSeguradoras || []} />
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Apolices Vencendo */}
          <Paper sx={{ p: 2.5, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight="bold">Apolices Vencendo</Typography>
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
                <Typography variant="caption" color="text.secondary" display="block">Nenhuma apolice vencendo nos proximos 30 dias</Typography>
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
                              {apolice.seguradoraNome || 'Seguradora nao informada'} - Vence em {new Date(apolice.dataVencimento).toLocaleDateString('pt-BR')}
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
                <Typography variant="subtitle2" fontWeight="bold">Resumo Financeiro de Sinistros</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 160, p: 1.5, borderRadius: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                    <TrendingDownIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.65rem' }}>PREJUIZOS</Typography>
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
                {(metrics?.valorTotalPrejuizos || 0) > 0 && (
                  <Box sx={{ flex: 1, minWidth: 160, p: 1.5, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.65rem', mb: 0.5 }}>
                      COBERTURA: {coberturaPercentual.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(coberturaPercentual, 100)}
                      sx={{ height: 6, borderRadius: 3, bgcolor: '#fee2e2', '& .MuiLinearProgress-bar': { bgcolor: '#22c55e', borderRadius: 3 } }}
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          )}

          {/* Financial Summary (non-CORRETORA) */}
          {user?.role !== 'CORRETORA' && (metrics?.valorTotalPrejuizos || 0) > 0 && (
            <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AttachMoneyIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight="bold">Valor Total dos Prejuizos</Typography>
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

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Resumo Rapido */}
          <Paper sx={{ p: 2.5, mb: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Resumo</Typography>
            {[
              { label: 'Documentos', value: metrics?.totalDocumentos || 0, icon: <FolderIcon sx={{ fontSize: 18 }} />, color: '#8b5cf6', href: '/dashboard/documentos' },
              { label: 'Orcamentos', value: metrics?.totalOrcamentos || 0, icon: <RequestQuoteIcon sx={{ fontSize: 18 }} />, color: '#06b6d4' },
              { label: 'Notificacoes', value: metrics?.notificacoesNaoLidas || 0, icon: <NotificationsActiveIcon sx={{ fontSize: 18 }} />, color: (metrics?.notificacoesNaoLidas || 0) > 0 ? '#f59e0b' : '#94a3b8', href: '/dashboard/notificacoes', badge: (metrics?.notificacoesNaoLidas || 0) > 0 },
            ].map((item) => (
              <Box
                key={item.label}
                onClick={() => item.href ? router.push(item.href) : undefined}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1,
                  borderRadius: 1.5, cursor: item.href ? 'pointer' : 'default',
                  '&:hover': item.href ? { bgcolor: '#f8fafc' } : {},
                  transition: 'all 0.15s',
                }}
              >
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                  {item.icon}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{item.label}</Typography>
                <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
                {item.badge && (
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b', flexShrink: 0 }} />
                )}
              </Box>
            ))}
          </Paper>

          {/* Activity Feed */}
          <Paper sx={{ p: 2.5, mb: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Atividade Recente</Typography>
            {chartsLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={40} animation="wave" />)}
              </Box>
            ) : (
              <ActivityFeed events={chartData?.recentActivity || []} />
            )}
          </Paper>

          {/* AI Insights */}
          <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', background: 'linear-gradient(135deg, #667eea05 0%, #764ba205 100%)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <SmartToyIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight="bold">Insights</Typography>
              </Box>
              <Button size="small" onClick={() => router.push('/dashboard/diagnostico')} sx={{ color: '#6366f1', minWidth: 'auto', fontSize: '0.75rem' }}>
                Diagnostico
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {aiInsights.map((insight, idx) => {
                const colors = getInsightColor(insight.type)
                return (
                  <motion.div key={idx} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + idx * 0.1 }}>
                    <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: colors.bg, borderLeft: `3px solid ${colors.border}`, display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                      <Box sx={{ color: colors.border, mt: 0.1 }}>{getInsightIcon(insight.type)}</Box>
                      <Typography variant="caption" sx={{ color: colors.text, lineHeight: 1.4 }}>{insight.message}</Typography>
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
