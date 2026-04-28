'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Skeleton,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BusinessIcon from '@mui/icons-material/Business'
import EditIcon from '@mui/icons-material/Edit'
import StarIcon from '@mui/icons-material/Star'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PolicyIcon from '@mui/icons-material/Policy'
import PeopleIcon from '@mui/icons-material/People'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ShieldIcon from '@mui/icons-material/Shield'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LanguageIcon from '@mui/icons-material/Language'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import { seguradoraService } from '@/services/seguradoraService'
import { apoliceService, getStatusApoliceLabel, getStatusApoliceColor } from '@/services/apoliceService'
import { iaService, ChatMessage } from '@/services/iaService'
import {
  SeguradoraResponse,
  SeguradoraStatsResponse,
  ApoliceListResponse,
} from '@/types'

// Stats Card
function StatsCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight="bold" lineHeight={1.2}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Box>
    </Paper>
  )
}

export default function SeguradoraDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [seguradora, setSeguradora] = useState<SeguradoraResponse | null>(null)
  const [stats, setStats] = useState<SeguradoraStatsResponse | null>(null)
  const [apolices, setApolices] = useState<ApoliceListResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingApolices, setLoadingApolices] = useState(true)

  // IA Chat
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const cgFileInputRef = useRef<HTMLInputElement>(null)
  const [cgUploading, setCgUploading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [seg, st] = await Promise.all([
        seguradoraService.getById(id),
        seguradoraService.getStats(id),
      ])
      setSeguradora(seg)
      setStats(st)
    } catch {
      // Error handled by empty state
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchApolices = useCallback(async () => {
    try {
      setLoadingApolices(true)
      const data = await apoliceService.list({ seguradoraId: id })
      setApolices(data.content || [])
    } catch {
      setApolices([])
    } finally {
      setLoadingApolices(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
    fetchApolices()
  }, [fetchData, fetchApolices])

  const handleChatSend = async () => {
    if (!chatInput.trim() || !seguradora) return
    const userMsg: ChatMessage = { role: 'user', content: chatInput }
    setMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await iaService.chat({
        message: `Sobre a seguradora ${seguradora.nome}: ${chatInput}`,
        history: [...messages, userMsg],
        context_type: 'cobertura',
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao consultar a IA.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 3 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={6} md={3} key={i}><Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} /></Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    )
  }

  if (!seguradora) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">Seguradora nao encontrada</Typography>
        <Button onClick={() => router.push('/dashboard/seguradoras')} sx={{ mt: 2 }}>Voltar</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Paper
        sx={{
          p: 4, mb: 3,
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
          color: 'white', borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={() => router.push('/dashboard/seguradoras')} sx={{ color: 'white' }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BusinessIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold">{seguradora.nome}</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
              {seguradora.cnpj && <Typography variant="body2" sx={{ opacity: 0.8 }}>CNPJ: {seguradora.cnpj}</Typography>}
              {seguradora.codigoSusep && <Typography variant="body2" sx={{ opacity: 0.8 }}>SUSEP: {seguradora.codigoSusep}</Typography>}
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<ChatIcon />}
            onClick={() => setChatOpen(true)}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Perguntar IA
          </Button>
        </Box>
        {seguradora.descricao && (
          <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 800, ml: 9 }}>
            {seguradora.descricao}
          </Typography>
        )}
      </Paper>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={6}>
            <StatsCard icon={<PolicyIcon sx={{ color: 'white', fontSize: 24 }} />} label="Total Apólices" value={stats.totalApolices} color="#3b82f6" />
          </Grid>
          <Grid item xs={6} md={6}>
            <StatsCard icon={<AttachMoneyIcon sx={{ color: 'white', fontSize: 24 }} />} label="Prêmio Médio" value={formatCurrency(stats.premioTotalMedio)} color="#f59e0b" />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Info */}
        <Grid item xs={12} md={5}>
          {/* Contact Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Informações de Contato</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {seguradora.telefone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">{seguradora.telefone}</Typography>
                </Box>
              )}
              {seguradora.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">{seguradora.email}</Typography>
                </Box>
              )}
              {seguradora.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LanguageIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ cursor: 'pointer', color: '#3b82f6', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => window.open(seguradora.website!.startsWith('http') ? seguradora.website : `https://${seguradora.website}`, '_blank')}>
                    {seguradora.website}
                  </Typography>
                </Box>
              )}
              {seguradora.enderecoCompleto && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">{seguradora.enderecoCompleto}</Typography>
                </Box>
              )}
              {!seguradora.telefone && !seguradora.email && !seguradora.website && !seguradora.enderecoCompleto && (
                <Typography variant="body2" color="text.secondary">Nenhuma informacao de contato cadastrada</Typography>
              )}
            </Box>
          </Paper>

          {/* Especialidades */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StarIcon sx={{ color: '#f59e0b' }} />
              <Typography variant="h6" fontWeight="bold">Especialidades</Typography>
            </Box>
            {(seguradora.especialidades || []).length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(seguradora.especialidades || []).map((esp, i) => (
                  <Chip key={i} label={esp} sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 500 }} />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">Nenhuma especialidade cadastrada</Typography>
            )}
          </Paper>

          {/* Condições Gerais (PDF) */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PictureAsPdfIcon sx={{ color: '#ef4444' }} />
                <Typography variant="h6" fontWeight="bold">Condições Gerais</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <input
                  ref={cgFileInputRef}
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      setCgUploading(true)
                      const updated = await seguradoraService.uploadCondicoesGerais(seguradora.id, file)
                      setSeguradora(updated)
                    } catch (err) {
                      console.error('Erro upload CG:', err)
                    } finally {
                      setCgUploading(false)
                      e.target.value = ''
                    }
                  }}
                />
                <Button size="small" variant="outlined" onClick={() => cgFileInputRef.current?.click()} disabled={cgUploading}>
                  {cgUploading ? 'Enviando...' : (seguradora.condicoesGeraisUrl ? 'Substituir' : 'Upload PDF')}
                </Button>
                {seguradora.condicoesGeraisUrl && (
                  <Button size="small" variant="outlined" color="error" onClick={async () => {
                    try {
                      const updated = await seguradoraService.removerCondicoesGerais(seguradora.id)
                      setSeguradora(updated)
                    } catch (err) { console.error(err) }
                  }}>Remover</Button>
                )}
              </Box>
            </Box>
            {seguradora.condicoesGeraisUrl ? (
              <Box>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PictureAsPdfIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                  {seguradora.condicoesGeraisNomeArquivo || 'Condições Gerais.pdf'}
                </Typography>
                {seguradora.condicoesGeraisAtualizadoEm && (
                  <Typography variant="caption" color="text.secondary">
                    Atualizado em {new Date(seguradora.condicoesGeraisAtualizadoEm).toLocaleDateString('pt-BR')}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nenhuma Condição Geral cadastrada. Faça o upload do PDF mais recente para que a IA possa consultá-lo.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Apolices */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Apólices Vinculadas
              {!loadingApolices && <Chip label={apolices.length} size="small" sx={{ ml: 1 }} />}
            </Typography>

            {loadingApolices ? (
              <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
            ) : apolices.length === 0 ? (
              <Alert severity="info">Nenhuma apólice vinculada a esta seguradora.</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Numero</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Condominio</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Vigência</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Premio</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Coberturas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {apolices.map(apolice => (
                      <TableRow key={apolice.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{apolice.numeroApolice || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{apolice.condominioNome || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={getStatusApoliceLabel(apolice.status)} size="small" color={getStatusApoliceColor(apolice.status)} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {apolice.dataInicio ? new Date(apolice.dataInicio).toLocaleDateString('pt-BR') : '-'} - {apolice.dataFim ? new Date(apolice.dataFim).toLocaleDateString('pt-BR') : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500}>{formatCurrency(apolice.premioTotal)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={apolice.quantidadeCoberturas || 0} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Summary */}
            {apolices.length > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Total premios: <strong>{formatCurrency(apolices.reduce((sum, a) => sum + (a.premioTotal || 0), 0))}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  IS Total: <strong>{formatCurrency(apolices.reduce((sum, a) => sum + (a.importanciaSeguradaTotal || 0), 0))}</strong>
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Observacoes */}
          {seguradora.observacoes && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Observações</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{seguradora.observacoes}</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* IA Chat Dialog */}
      <Dialog open={chatOpen} onClose={() => setChatOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon sx={{ color: '#3b82f6' }} />
          Perguntar sobre {seguradora.nome}
          <IconButton onClick={() => setChatOpen(false)} sx={{ ml: 'auto' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ minHeight: 300, maxHeight: 400, overflow: 'auto', mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                Pergunte qualquer coisa sobre {seguradora.nome}. Ex: &quot;Quais sao as regras de franquia?&quot;
              </Typography>
            )}
            {messages.map((msg, i) => (
              <Paper key={i} sx={{
                p: 1.5,
                bgcolor: msg.role === 'user' ? '#eff6ff' : '#f0fdf4',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%', borderRadius: 2,
              }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
              </Paper>
            ))}
            {chatLoading && <CircularProgress size={24} sx={{ alignSelf: 'center' }} />}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth size="small" placeholder="Sua pergunta..." value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleChatSend() }}
              disabled={chatLoading} />
            <Button variant="contained" onClick={handleChatSend} disabled={chatLoading || !chatInput.trim()}>Enviar</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
