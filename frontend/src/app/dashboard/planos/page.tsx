'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import StarIcon from '@mui/icons-material/Star'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import HistoryIcon from '@mui/icons-material/History'
import ReceiptIcon from '@mui/icons-material/Receipt'
import AddIcon from '@mui/icons-material/Add'
import { billingService, formatCurrency } from '@/services/billingService'
import { PlanoResponse, AssinaturaResponse } from '@/types'

const FEATURES_LABELS: Record<string, string> = {
  temDiagnostico: 'Diagnostico Tecnico',
  temAssistenteIa: 'Assistente IA',
  temRag: 'Analise de Documentos (RAG)',
  temVistoriaCompleta: 'Vistoria Completa',
  temLaudoTecnico: 'Laudo Tecnico',
  temParceiros: 'Marketplace Parceiros',
  temRelatoriosAvancados: 'Relatorios Avancados',
  temApiAcesso: 'Acesso via API',
}

export default function PlanosPage() {
  const [planos, setPlanos] = useState<PlanoResponse[]>([])
  const [assinaturaAtiva, setAssinaturaAtiva] = useState<AssinaturaResponse | null>(null)
  const [historico, setHistorico] = useState<AssinaturaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoPagamento, setTipoPagamento] = useState<string>('MENSAL')
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; plano?: PlanoResponse }>({ open: false })
  const [cancelDialog, setCancelDialog] = useState(false)
  const [showHistorico, setShowHistorico] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [planosData, assinatura, hist] = await Promise.all([
        billingService.listPlanos(),
        billingService.getAssinaturaAtiva(),
        billingService.getHistorico(),
      ])
      setPlanos(planosData)
      setAssinaturaAtiva(assinatura)
      setHistorico(hist)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssinar = async (plano: PlanoResponse) => {
    setConfirmDialog({ open: false })
    try {
      await billingService.createAssinatura({
        planoId: plano.id,
        tipoPagamento,
      })
      setSnackbar({ open: true, message: `Assinatura do plano ${plano.nome} realizada!`, severity: 'success' })
      loadData()
    } catch {
      setSnackbar({ open: true, message: 'Erro ao realizar assinatura', severity: 'error' })
    }
  }

  const handleCancelar = async () => {
    setCancelDialog(false)
    try {
      await billingService.cancelarAssinatura()
      setSnackbar({ open: true, message: 'Assinatura cancelada', severity: 'success' })
      loadData()
    } catch {
      setSnackbar({ open: true, message: 'Erro ao cancelar assinatura', severity: 'error' })
    }
  }

  const getPreco = (plano: PlanoResponse) => {
    if (tipoPagamento === 'ANUAL' && plano.precoAnual) {
      return plano.precoAnual / 12
    }
    return plano.precoMensal
  }

  const isPlanoAtual = (plano: PlanoResponse) => {
    return assinaturaAtiva?.planoId === plano.id
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={50} />
        <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" width={280} height={480} />
          ))}
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Planos e Assinatura
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Escolha o plano ideal para o seu negocio
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => setShowHistorico(!showHistorico)}
        >
          {showHistorico ? 'Ver Planos' : 'Historico'}
        </Button>
      </Box>

      {/* Assinatura Ativa */}
      {assinaturaAtiva && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button color="error" size="small" onClick={() => setCancelDialog(true)}>
              Cancelar
            </Button>
          }
        >
          Voce esta no plano <strong>{assinaturaAtiva.planoNome}</strong> ({assinaturaAtiva.tipoPagamento}).
          Valido ate {new Date(assinaturaAtiva.dataFim).toLocaleDateString('pt-BR')}.
          Valor: {formatCurrency(assinaturaAtiva.valor)}/{assinaturaAtiva.tipoPagamento === 'ANUAL' ? 'ano' : 'mes'}
        </Alert>
      )}

      {showHistorico ? (
        /* Historico */
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Plano</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Inicio</TableCell>
                <TableCell>Fim</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historico.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      Nenhum historico de assinatura
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                historico.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.planoNome}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        size="small"
                        color={item.status === 'ATIVA' ? 'success' : item.status === 'CANCELADA' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{item.tipoPagamento}</TableCell>
                    <TableCell>{formatCurrency(item.valor)}</TableCell>
                    <TableCell>{new Date(item.dataInicio).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{new Date(item.dataFim).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <>
          {/* Toggle Mensal/Anual */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <ToggleButtonGroup
              value={tipoPagamento}
              exclusive
              onChange={(_, val) => val && setTipoPagamento(val)}
              size="small"
            >
              <ToggleButton value="MENSAL">Mensal</ToggleButton>
              <ToggleButton value="ANUAL">
                Anual
                <Chip label="Economize" size="small" color="success" sx={{ ml: 1, height: 20 }} />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Planos Cards */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {planos.map((plano) => {
              const preco = getPreco(plano)
              const atual = isPlanoAtual(plano)

              return (
                <Card
                  key={plano.id}
                  sx={{
                    width: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: plano.destaque
                      ? '2px solid #3b82f6'
                      : atual
                        ? '2px solid #22c55e'
                        : '1px solid #e5e7eb',
                    borderRadius: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  {/* Destaque Badge */}
                  {plano.destaque && (
                    <Chip
                      icon={<StarIcon />}
                      label="Mais Popular"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 'bold',
                      }}
                    />
                  )}
                  {atual && (
                    <Chip
                      label="Plano Atual"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        right: 12,
                        fontWeight: 'bold',
                      }}
                    />
                  )}

                  <CardContent sx={{ flex: 1, pt: plano.destaque || atual ? 4 : 3 }}>
                    <Typography variant="h6" fontWeight="bold" textAlign="center">
                      {plano.nome}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                      sx={{ mb: 2, minHeight: 40 }}
                    >
                      {plano.descricao}
                    </Typography>

                    {/* Preco */}
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Typography variant="h3" fontWeight="bold" color="primary">
                        {preco === 0 ? 'Gratis' : formatCurrency(preco)}
                      </Typography>
                      {preco > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          /mes {tipoPagamento === 'ANUAL' && '(cobrado anualmente)'}
                        </Typography>
                      )}
                      {tipoPagamento === 'ANUAL' && plano.precoAnual && plano.precoAnual > 0 && (
                        <Typography variant="caption" color="success.main">
                          Total: {formatCurrency(plano.precoAnual)}/ano
                        </Typography>
                      )}
                    </Box>

                    {/* Limites */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {plano.maxCondominios ? `Ate ${plano.maxCondominios} condominios` : 'Condominios ilimitados'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {plano.maxDocumentosMes ? `${plano.maxDocumentosMes} docs/mes` : 'Documentos ilimitados'}
                      </Typography>
                      <Typography variant="body2">
                        {plano.maxUsuarios ? `${plano.maxUsuarios} usuarios` : 'Usuarios ilimitados'}
                      </Typography>
                    </Box>

                    {/* Features */}
                    <Box>
                      {Object.entries(FEATURES_LABELS).map(([key, label]) => {
                        const enabled = plano[key as keyof PlanoResponse]
                        return (
                          <Box
                            key={key}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            {enabled ? (
                              <CheckCircleIcon sx={{ fontSize: 18, color: '#22c55e' }} />
                            ) : (
                              <CancelIcon sx={{ fontSize: 18, color: '#d1d5db' }} />
                            )}
                            <Typography
                              variant="body2"
                              sx={{ color: enabled ? 'text.primary' : 'text.disabled' }}
                            >
                              {label}
                            </Typography>
                          </Box>
                        )
                      })}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    {atual ? (
                      <Button fullWidth variant="outlined" color="success" disabled>
                        Plano Atual
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant={plano.destaque ? 'contained' : 'outlined'}
                        startIcon={<CreditCardIcon />}
                        onClick={() => setConfirmDialog({ open: true, plano })}
                      >
                        {plano.precoMensal === 0 ? 'Comecar Gratis' : 'Assinar'}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              )
            })}
          </Box>
        </>
      )}

      {/* Dialog Confirmar Assinatura */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false })}>
        <DialogTitle>Confirmar Assinatura</DialogTitle>
        <DialogContent>
          {confirmDialog.plano && (
            <Typography>
              Deseja assinar o plano <strong>{confirmDialog.plano.nome}</strong> no formato{' '}
              <strong>{tipoPagamento}</strong> por{' '}
              <strong>
                {tipoPagamento === 'ANUAL' && confirmDialog.plano.precoAnual
                  ? formatCurrency(confirmDialog.plano.precoAnual) + '/ano'
                  : formatCurrency(confirmDialog.plano.precoMensal) + '/mes'}
              </strong>
              ?
              {assinaturaAtiva && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Sua assinatura atual ({assinaturaAtiva.planoNome}) sera cancelada automaticamente.
                </Alert>
              )}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false })}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => confirmDialog.plano && handleAssinar(confirmDialog.plano)}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Cancelar */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle>Cancelar Assinatura</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja cancelar sua assinatura do plano{' '}
            <strong>{assinaturaAtiva?.planoNome}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Voce perdera acesso aos recursos do plano imediatamente.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Manter Assinatura</Button>
          <Button variant="contained" color="error" onClick={handleCancelar}>
            Cancelar Assinatura
          </Button>
        </DialogActions>
      </Dialog>

      {/* Historico de Faturas */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ReceiptIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Historico de Faturas
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Descricao</TableCell>
                <TableCell>Valor (R$)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Acao</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box sx={{ py: 4 }}>
                    <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">
                      Nenhuma fatura disponivel
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Alert severity="info" sx={{ mt: 2 }}>
          O historico de faturas estara disponivel apos a primeira cobranca.
        </Alert>
      </Paper>

      {/* Metodo de Pagamento */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CreditCardIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Metodo de Pagamento
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <CreditCardIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Nenhum metodo de pagamento cadastrado
          </Typography>
          <Tooltip title="Em breve" arrow>
            <span>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                disabled
              >
                Adicionar Metodo
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
