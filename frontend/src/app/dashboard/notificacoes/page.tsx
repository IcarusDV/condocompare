'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Alert,
  Skeleton,
  CircularProgress,
  Divider,
  TablePagination,
  Tooltip,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import EventIcon from '@mui/icons-material/Event'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import DescriptionIcon from '@mui/icons-material/Description'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useRouter } from 'next/navigation'
import {
  notificacaoService,
  getTipoNotificacaoLabel,
  getTipoNotificacaoColor,
} from '@/services/notificacaoService'
import { NotificacaoResponse } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

const getTipoIcon = (tipo: string) => {
  switch (tipo) {
    case 'VENCIMENTO_APOLICE':
      return <EventIcon />
    case 'VISTORIA_AGENDADA':
      return <AssignmentIcon />
    case 'SINISTRO_ATUALIZADO':
      return <ReportProblemIcon />
    case 'DOCUMENTO_PROCESSADO':
      return <DescriptionIcon />
    default:
      return <NotificationsIcon />
  }
}

const getReferenciaUrl = (referenciaTipo?: string, referenciaId?: string): string | null => {
  if (!referenciaTipo || !referenciaId) return null

  switch (referenciaTipo) {
    case 'CONDOMINIO':
      return `/dashboard/condominios/${referenciaId}`
    case 'DOCUMENTO':
      return `/dashboard/documentos`
    case 'VISTORIA':
      return `/dashboard/vistorias`
    case 'SINISTRO':
      return `/dashboard/sinistros`
    default:
      return null
  }
}

export default function NotificacoesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [notificacoes, setNotificacoes] = useState<NotificacaoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadNotificacoes = async () => {
    try {
      setLoading(true)
      const response = await notificacaoService.list({ page, size: rowsPerPage })
      setNotificacoes(response.content)
      setTotalElements(response.totalElements)
    } catch (err) {
      console.error('Error loading notificacoes:', err)
      setError('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotificacoes()
  }, [page, rowsPerPage])

  const handleMarcarComoLida = async (id: string) => {
    try {
      setActionLoading(id)
      await notificacaoService.marcarComoLida(id)
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true, dataLeitura: new Date().toISOString() } : n))
      )
    } catch (err) {
      console.error('Error marking as read:', err)
      setError('Erro ao marcar como lida')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarcarTodasComoLidas = async () => {
    try {
      setActionLoading('all')
      await notificacaoService.marcarTodasComoLidas()
      setNotificacoes((prev) =>
        prev.map((n) => ({ ...n, lida: true, dataLeitura: new Date().toISOString() }))
      )
    } catch (err) {
      console.error('Error marking all as read:', err)
      setError('Erro ao marcar todas como lidas')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(id)
      await notificacaoService.delete(id)
      setNotificacoes((prev) => prev.filter((n) => n.id !== id))
      setTotalElements((prev) => prev - 1)
    } catch (err) {
      console.error('Error deleting notification:', err)
      setError('Erro ao excluir notificação')
    } finally {
      setActionLoading(null)
    }
  }

  const handleVerificarVencimentos = async () => {
    try {
      setActionLoading('verify')
      await notificacaoService.verificarVencimentos()
      loadNotificacoes()
    } catch (err) {
      console.error('Error verifying:', err)
      setError('Erro ao verificar vencimentos')
    } finally {
      setActionLoading(null)
    }
  }

  const handleClickNotificacao = (notificacao: NotificacaoResponse) => {
    // First mark as read
    if (!notificacao.lida) {
      handleMarcarComoLida(notificacao.id)
    }

    // Navigate if there's a reference
    const url = getReferenciaUrl(notificacao.referenciaTipo, notificacao.referenciaId)
    if (url) {
      router.push(url)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} min atrás`
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`
    } else if (diffDays < 7) {
      return `${diffDays}d atrás`
    }
    return date.toLocaleDateString('pt-BR')
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Notificações
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {naoLidas > 0 ? `${naoLidas} não lida(s)` : 'Todas as notificações foram lidas'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {user?.role === 'ADMIN' && (
            <Button
              variant="outlined"
              size="small"
              startIcon={actionLoading === 'verify' ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={handleVerificarVencimentos}
              disabled={actionLoading === 'verify'}
            >
              Verificar Vencimentos
            </Button>
          )}
          {naoLidas > 0 && (
            <Button
              variant="contained"
              size="small"
              startIcon={actionLoading === 'all' ? <CircularProgress size={16} color="inherit" /> : <DoneAllIcon />}
              onClick={handleMarcarTodasComoLidas}
              disabled={actionLoading === 'all'}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Marcar Todas como Lidas
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Notifications List */}
      <Paper sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        {loading ? (
          <Box sx={{ p: 1 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 2 }}>
                <Skeleton variant="circular" width={40} height={40} animation="wave" />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} animation="wave" />
                  <Skeleton variant="text" width="90%" height={18} animation="wave" />
                  <Skeleton variant="text" width="30%" height={16} animation="wave" />
                </Box>
              </Box>
            ))}
          </Box>
        ) : notificacoes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <NotificationsIcon sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhuma notificação
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Você será notificado sobre vencimentos, vistorias e sinistros
            </Typography>
          </Box>
        ) : (
          <>
            <List disablePadding>
              {notificacoes.map((notificacao, index) => (
                <Box key={notificacao.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      py: 2,
                      bgcolor: notificacao.lida ? 'transparent' : '#eff6ff',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: notificacao.lida ? '#f8fafc' : '#dbeafe' },
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => handleClickNotificacao(notificacao)}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 48,
                        color: getTipoNotificacaoColor(notificacao.tipo) === 'error'
                          ? '#ef4444'
                          : getTipoNotificacaoColor(notificacao.tipo) === 'warning'
                          ? '#f59e0b'
                          : getTipoNotificacaoColor(notificacao.tipo) === 'success'
                          ? '#22c55e'
                          : '#3b82f6',
                      }}
                    >
                      {getTipoIcon(notificacao.tipo)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body1"
                            fontWeight={notificacao.lida ? 400 : 600}
                            sx={{ color: notificacao.lida ? 'text.secondary' : 'text.primary' }}
                          >
                            {notificacao.titulo}
                          </Typography>
                          {!notificacao.lida && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#3b82f6',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {notificacao.mensagem}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={getTipoNotificacaoLabel(notificacao.tipo)}
                              size="small"
                              color={getTipoNotificacaoColor(notificacao.tipo)}
                              variant="outlined"
                              sx={{ height: 22 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(notificacao.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {!notificacao.lida && (
                          <Tooltip title="Marcar como lida">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarcarComoLida(notificacao.id)
                              }}
                              disabled={actionLoading === notificacao.id}
                            >
                              {actionLoading === notificacao.id ? (
                                <CircularProgress size={18} />
                              ) : (
                                <CheckIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(notificacao.id)
                            }}
                            disabled={actionLoading === notificacao.id}
                            sx={{ color: '#ef4444' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Box>
              ))}
            </List>
            <TablePagination
              component="div"
              count={totalElements}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10))
                setPage(0)
              }}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        )}
      </Paper>
    </Box>
  )
}
