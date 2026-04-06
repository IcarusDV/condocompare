'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  Divider,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Skeleton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import BusinessIcon from '@mui/icons-material/Business'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import StarIcon from '@mui/icons-material/Star'
import GavelIcon from '@mui/icons-material/Gavel'
import VerifiedIcon from '@mui/icons-material/Verified'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import CloseIcon from '@mui/icons-material/Close'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LanguageIcon from '@mui/icons-material/Language'
import ChatIcon from '@mui/icons-material/Chat'
import { seguradoraService } from '@/services/seguradoraService'
import { iaService, ChatMessage } from '@/services/iaService'
import {
  SeguradoraResponse,
  SeguradoraStatsResponse,
  CreateSeguradoraRequest,
} from '@/types'

// ===== Tab Panel =====
function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null
}

// ===== Stats Mini Card =====
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </Paper>
  )
}

// ===== CRUD Dialog =====
function SeguradoraFormDialog({
  open,
  onClose,
  onSave,
  seguradora,
  saving,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: CreateSeguradoraRequest) => void
  seguradora?: SeguradoraResponse | null
  saving: boolean
}) {
  const [form, setForm] = useState<CreateSeguradoraRequest>({
    nome: '',
    cnpj: '',
    codigoSusep: '',
    telefone: '',
    email: '',
    website: '',
    enderecoCompleto: '',
    descricao: '',
    especialidades: [],
    regras: [],
    iaConhecimento: [],
  })
  const [newEspecialidade, setNewEspecialidade] = useState('')
  const [newRegra, setNewRegra] = useState('')
  const [newIaConhecimento, setNewIaConhecimento] = useState('')

  useEffect(() => {
    if (seguradora) {
      setForm({
        nome: seguradora.nome || '',
        cnpj: seguradora.cnpj || '',
        codigoSusep: seguradora.codigoSusep || '',
        telefone: seguradora.telefone || '',
        email: seguradora.email || '',
        website: seguradora.website || '',
        enderecoCompleto: seguradora.enderecoCompleto || '',
        descricao: seguradora.descricao || '',
        especialidades: seguradora.especialidades || [],
        regras: seguradora.regras || [],
        iaConhecimento: seguradora.iaConhecimento || [],
      })
    } else {
      setForm({ nome: '', cnpj: '', codigoSusep: '', telefone: '', email: '', website: '', enderecoCompleto: '', descricao: '', especialidades: [], regras: [], iaConhecimento: [] })
    }
  }, [seguradora, open])

  const handleAddChip = (field: 'especialidades' | 'regras' | 'iaConhecimento', value: string, setter: (v: string) => void) => {
    if (value.trim()) {
      setForm(prev => ({ ...prev, [field]: [...(prev[field] || []), value.trim()] }))
      setter('')
    }
  }

  const handleRemoveChip = (field: 'especialidades' | 'regras' | 'iaConhecimento', index: number) => {
    setForm(prev => ({ ...prev, [field]: (prev[field] || []).filter((_, i) => i !== index) }))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{seguradora ? 'Editar Seguradora' : 'Nova Seguradora'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nome *" value={form.nome} onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="CNPJ" value={form.cnpj} onChange={e => setForm(prev => ({ ...prev, cnpj: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Código SUSEP" value={form.codigoSusep} onChange={e => setForm(prev => ({ ...prev, codigoSusep: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Telefone" value={form.telefone} onChange={e => setForm(prev => ({ ...prev, telefone: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Website" value={form.website} onChange={e => setForm(prev => ({ ...prev, website: e.target.value }))} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Endereço Completo" value={form.enderecoCompleto} onChange={e => setForm(prev => ({ ...prev, enderecoCompleto: e.target.value }))} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Descrição" value={form.descricao} onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))} />
          </Grid>

          {/* Especialidades */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Especialidades</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {(form.especialidades || []).map((esp, i) => (
                <Chip key={i} label={esp} size="small" onDelete={() => handleRemoveChip('especialidades', i)} sx={{ bgcolor: '#dbeafe', color: '#1e40af' }} />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth placeholder="Adicionar especialidade..." value={newEspecialidade} onChange={e => setNewEspecialidade(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChip('especialidades', newEspecialidade, setNewEspecialidade) }}} />
              <Button variant="outlined" size="small" onClick={() => handleAddChip('especialidades', newEspecialidade, setNewEspecialidade)}>Add</Button>
            </Box>
          </Grid>

          {/* Regras */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Regras e Particularidades</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
              {(form.regras || []).map((regra, i) => (
                <Chip key={i} label={regra} size="small" onDelete={() => handleRemoveChip('regras', i)} sx={{ justifyContent: 'flex-start', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }} />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth placeholder="Adicionar regra..." value={newRegra} onChange={e => setNewRegra(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChip('regras', newRegra, setNewRegra) }}} />
              <Button variant="outlined" size="small" onClick={() => handleAddChip('regras', newRegra, setNewRegra)}>Add</Button>
            </Box>
          </Grid>

          {/* IA Conhecimento */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>O que a IA sabe</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {(form.iaConhecimento || []).map((info, i) => (
                <Chip key={i} label={info} size="small" onDelete={() => handleRemoveChip('iaConhecimento', i)} sx={{ bgcolor: '#d1fae5', color: '#065f46' }} />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth placeholder="Adicionar conhecimento IA..." value={newIaConhecimento} onChange={e => setNewIaConhecimento(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChip('iaConhecimento', newIaConhecimento, setNewIaConhecimento) }}} />
              <Button variant="outlined" size="small" onClick={() => handleAddChip('iaConhecimento', newIaConhecimento, setNewIaConhecimento)}>Add</Button>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onSave(form)} disabled={!form.nome.trim() || saving}>
          {saving ? <CircularProgress size={20} /> : seguradora ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ===== IA Chat Dialog =====
function IAChatDialog({ open, onClose, seguradora }: { open: boolean; onClose: () => void; seguradora: SeguradoraResponse | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && seguradora) {
      setMessages([])
      setInput('')
    }
  }, [open, seguradora])

  const handleSend = async () => {
    if (!input.trim() || !seguradora) return
    const userMsg: ChatMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await iaService.chat({
        message: `Sobre a seguradora ${seguradora.nome}: ${input}`,
        history: [...messages, userMsg],
        context_type: 'cobertura',
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao consultar a IA. Tente novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToyIcon sx={{ color: '#3b82f6' }} />
        Perguntar sobre {seguradora?.nome}
        <IconButton onClick={onClose} sx={{ ml: 'auto' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ minHeight: 300, maxHeight: 400, overflow: 'auto', mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {messages.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              Pergunte qualquer coisa sobre {seguradora?.nome}. Ex: &quot;Quais são as coberturas mais comuns?&quot;, &quot;Como funciona a franquia?&quot;
            </Typography>
          )}
          {messages.map((msg, i) => (
            <Paper key={i} sx={{
              p: 1.5,
              bgcolor: msg.role === 'user' ? '#eff6ff' : '#f0fdf4',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              borderRadius: 2,
            }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
            </Paper>
          ))}
          {loading && <CircularProgress size={24} sx={{ alignSelf: 'center' }} />}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth size="small"
            placeholder="Pergunte sobre esta seguradora..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
            disabled={loading}
          />
          <Button variant="contained" onClick={handleSend} disabled={loading || !input.trim()}>Enviar</Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

// ===== Delete Confirm Dialog =====
function DeleteDialog({
  open, onClose, onConfirm, seguradora, deleting,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; seguradora: SeguradoraResponse | null; deleting: boolean
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Excluir Seguradora</DialogTitle>
      <DialogContent>
        <Typography>Tem certeza que deseja excluir <strong>{seguradora?.nome}</strong>? Esta ação não pode ser desfeita.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={deleting}>
          {deleting ? <CircularProgress size={20} /> : 'Excluir'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ===== Main Page =====
export default function SeguradorasPage() {
  const router = useRouter()
  const [seguradoras, setSeguradoras] = useState<SeguradoraResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [tab, setTab] = useState(0)

  // CRUD state
  const [formOpen, setFormOpen] = useState(false)
  const [editingSeguradora, setEditingSeguradora] = useState<SeguradoraResponse | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingSeguradora, setDeletingSeguradora] = useState<SeguradoraResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  // IA Chat
  const [chatOpen, setChatOpen] = useState(false)
  const [chatSeguradora, setChatSeguradora] = useState<SeguradoraResponse | null>(null)

  // Stats cache
  const [statsMap, setStatsMap] = useState<Record<string, SeguradoraStatsResponse>>({})
  const [loadingStats, setLoadingStats] = useState(false)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  // Comparative selection
  const [compareIds, setCompareIds] = useState<string[]>([])

  const ALLOWED_SEGURADORAS = ['ALLIANZ', 'AXA', 'CHUBB', 'HDI', 'TOKIO MARINE']

  const fetchSeguradoras = useCallback(async () => {
    try {
      setLoading(true)
      const data = await seguradoraService.list()
      const filtered = data.filter(s =>
        ALLOWED_SEGURADORAS.some(name => s.nome.toUpperCase().includes(name))
      )
      setSeguradoras(filtered)
    } catch {
      setSnackbar({ open: true, message: 'Erro ao carregar seguradoras' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSeguradoras()
  }, [fetchSeguradoras])

  // Load stats when comparative tab is opened
  useEffect(() => {
    if (tab === 1 && seguradoras.length > 0 && Object.keys(statsMap).length === 0) {
      setLoadingStats(true)
      Promise.all(
        seguradoras.map(s => seguradoraService.getStats(s.id).then(stats => ({ id: s.id, stats })).catch(() => null))
      ).then(results => {
        const map: Record<string, SeguradoraStatsResponse> = {}
        results.forEach(r => { if (r) map[r.id] = r.stats })
        setStatsMap(map)
      }).finally(() => setLoadingStats(false))
    }
  }, [tab, seguradoras, statsMap])

  const filtered = useMemo(() => {
    if (!busca.trim()) return seguradoras
    const term = busca.toLowerCase()
    return seguradoras.filter(
      s =>
        s.nome.toLowerCase().includes(term) ||
        (s.descricao || '').toLowerCase().includes(term) ||
        (s.especialidades || []).some(e => e.toLowerCase().includes(term)) ||
        (s.cnpj || '').includes(term)
    )
  }, [busca, seguradoras])

  const handleSave = async (data: CreateSeguradoraRequest) => {
    setSaving(true)
    try {
      if (editingSeguradora) {
        await seguradoraService.update(editingSeguradora.id, data)
        setSnackbar({ open: true, message: 'Seguradora atualizada com sucesso' })
      } else {
        await seguradoraService.create(data)
        setSnackbar({ open: true, message: 'Seguradora criada com sucesso' })
      }
      setFormOpen(false)
      setEditingSeguradora(null)
      fetchSeguradoras()
    } catch {
      setSnackbar({ open: true, message: 'Erro ao salvar seguradora' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingSeguradora) return
    setDeleting(true)
    try {
      await seguradoraService.delete(deletingSeguradora.id)
      setSnackbar({ open: true, message: 'Seguradora excluída com sucesso' })
      setDeleteOpen(false)
      setDeletingSeguradora(null)
      fetchSeguradoras()
    } catch {
      setSnackbar({ open: true, message: 'Erro ao excluir seguradora' })
    } finally {
      setDeleting(false)
    }
  }

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev)
  }

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Paper
        sx={{
          p: 4, mb: 3,
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
          color: 'white', borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <BusinessIcon sx={{ fontSize: 36 }} />
              <Typography variant="h4" fontWeight="bold">Seguradoras</Typography>
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 700 }}>
              Gerencie as seguradoras parceiras, visualize estatísticas, compare métricas e consulte a IA sobre cada uma.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditingSeguradora(null); setFormOpen(true) }}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Nova Seguradora
          </Button>
        </Box>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <StatCard icon={<BusinessIcon sx={{ color: 'white', fontSize: 20 }} />} label="Total Seguradoras" value={seguradoras.length} color="#3b82f6" />
        </Grid>
      </Grid>

      {/* AI Alert */}
      <Alert
        severity="info"
        icon={<SmartToyIcon />}
        sx={{ mb: 3, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', '& .MuiAlert-icon': { color: '#3b82f6' } }}
      >
        <Typography variant="body2">
          <strong>Assistente IA integrado:</strong> Clique no ícone de chat em cada seguradora para perguntar diretamente a IA sobre regras, coberturas, franquias e particularidades.
        </Typography>
      </Alert>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
          <Tab label="Seguradoras" icon={<BusinessIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
          <Tab label="Comparativo" icon={<CompareArrowsIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* TAB 0: Seguradoras List */}
      <TabPanel value={tab} index={0}>
        {/* Search */}
        <TextField
          fullWidth size="small"
          placeholder="Buscar seguradora por nome, CNPJ ou especialidade..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
          }}
        />

        {/* Loading Skeleton */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map(i => (
              <Grid item xs={12} md={6} key={i}>
                <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : filtered.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {busca ? `Nenhuma seguradora encontrada para "${busca}"` : 'Nenhuma seguradora cadastrada'}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filtered.map(seguradora => (
              <Grid item xs={12} md={6} key={seguradora.id}>
                <Paper
                  sx={{
                    p: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 },
                    border: compareIds.includes(seguradora.id) ? '2px solid #3b82f6' : '1px solid transparent',
                  }}
                >
                  {/* Card Header */}
                  <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BusinessIcon sx={{ color: 'white', fontSize: 22 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">{seguradora.nome}</Typography>
                          {seguradora.cnpj && (
                            <Typography variant="caption" color="text.secondary">CNPJ: {seguradora.cnpj}</Typography>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Perguntar a IA">
                          <IconButton size="small" onClick={() => { setChatSeguradora(seguradora); setChatOpen(true) }}>
                            <ChatIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver detalhes">
                          <IconButton size="small" onClick={() => router.push(`/dashboard/seguradoras/${seguradora.id}`)}>
                            <VisibilityIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => { setEditingSeguradora(seguradora); setFormOpen(true) }}>
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton size="small" onClick={() => { setDeletingSeguradora(seguradora); setDeleteOpen(true) }}>
                            <DeleteIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={compareIds.includes(seguradora.id) ? 'Remover do comparativo' : 'Adicionar ao comparativo'}>
                          <IconButton size="small" onClick={() => toggleCompare(seguradora.id)}>
                            <CompareArrowsIcon sx={{ fontSize: 18, color: compareIds.includes(seguradora.id) ? '#3b82f6' : '#94a3b8' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {seguradora.descricao || seguradora.observacoes || 'Sem descrição disponível'}
                    </Typography>
                    {/* Contact info chips */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {seguradora.telefone && (
                        <Chip icon={<PhoneIcon sx={{ fontSize: '14px !important' }} />} label={seguradora.telefone} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      )}
                      {seguradora.email && (
                        <Chip icon={<EmailIcon sx={{ fontSize: '14px !important' }} />} label={seguradora.email} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      )}
                      {seguradora.website && (
                        <Chip icon={<LanguageIcon sx={{ fontSize: '14px !important' }} />} label={seguradora.website} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} onClick={() => window.open(seguradora.website!.startsWith('http') ? seguradora.website : `https://${seguradora.website}`, '_blank')} />
                      )}
                    </Box>
                  </Box>

                  {/* Card Body */}
                  <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Especialidades */}
                    {(seguradora.especialidades || []).length > 0 && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <StarIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Especialidades</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(seguradora.especialidades || []).map((esp, i) => (
                            <Chip key={i} label={esp} size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 500, fontSize: '0.75rem' }} />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {(seguradora.especialidades || []).length > 0 && (seguradora.regras || []).length > 0 && <Divider />}

                    {/* Regras */}
                    {(seguradora.regras || []).length > 0 && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <GavelIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Regras e Particularidades</Typography>
                        </Box>
                        <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.5 } }}>
                          {(seguradora.regras || []).map((regra, i) => (
                            <Typography component="li" variant="body2" key={i} sx={{ lineHeight: 1.5 }}>{regra}</Typography>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {(seguradora.regras || []).length > 0 && (seguradora.iaConhecimento || []).length > 0 && <Divider />}

                    {/* IA Conhecimento */}
                    {(seguradora.iaConhecimento || []).length > 0 && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <SmartToyIcon sx={{ fontSize: 16, color: '#10b981' }} />
                          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">O que a IA sabe</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(seguradora.iaConhecimento || []).map((info, i) => (
                            <Chip key={i} icon={<VerifiedIcon sx={{ fontSize: '14px !important' }} />} label={info} size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 500, fontSize: '0.75rem', '& .MuiChip-icon': { color: '#10b981' } }} />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Card Footer */}
                  <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => router.push(`/dashboard/seguradoras/${seguradora.id}`)}>
                      Detalhes
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<ChatIcon />} onClick={() => { setChatSeguradora(seguradora); setChatOpen(true) }} sx={{ color: '#3b82f6', borderColor: '#3b82f6' }}>
                      Perguntar IA
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* TAB 1: Comparative */}
      <TabPanel value={tab} index={1}>
        {compareIds.length < 2 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Selecione pelo menos 2 seguradoras na aba &quot;Seguradoras&quot; (clicando no ícone de comparação) para ver o comparativo detalhado.
            {compareIds.length === 1 && ' Você selecionou 1 - selecione mais.'}
            {compareIds.length === 0 && ' A tabela abaixo mostra todas as seguradoras.'}
          </Alert>
        )}

        {loadingStats ? (
          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* Comparative Table */}
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Seguradora</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Especialidades</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Regras</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Info IA</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Apólices</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Vigentes</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Prêmio Médio</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Condomínios</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(compareIds.length >= 2
                    ? seguradoras.filter(s => compareIds.includes(s.id))
                    : seguradoras
                  ).map(s => {
                    const stats = statsMap[s.id]
                    return (
                      <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/dashboard/seguradoras/${s.id}`)}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <BusinessIcon sx={{ color: 'white', fontSize: 16 }} />
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{s.nome}</Typography>
                              {s.cnpj && <Typography variant="caption" color="text.secondary">{s.cnpj}</Typography>}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{(s.especialidades || []).length}</TableCell>
                        <TableCell align="center">{(s.regras || []).length}</TableCell>
                        <TableCell align="center">{(s.iaConhecimento || []).length}</TableCell>
                        <TableCell align="center">{stats?.totalApolices ?? '-'}</TableCell>
                        <TableCell align="center">
                          <Chip label={stats?.apolicesVigentes ?? '-'} size="small" color={stats && stats.apolicesVigentes > 0 ? 'success' : 'default'} />
                        </TableCell>
                        <TableCell align="center">{stats ? formatCurrency(stats.premioTotalMedio) : '-'}</TableCell>
                        <TableCell align="center">{stats?.totalCondominios ?? '-'}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Rules Comparison (when items are selected) */}
            {compareIds.length >= 2 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Comparativo de Regras e Particularidades</Typography>
                <Grid container spacing={3}>
                  {seguradoras.filter(s => compareIds.includes(s.id)).map(s => (
                    <Grid item xs={12} md={6} key={s.id}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: '#1e40af' }}>{s.nome}</Typography>
                        <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#6366f1' }}>Regras:</Typography>
                        {(s.regras || []).length > 0 ? (
                          <Box component="ul" sx={{ m: 0, pl: 2, mb: 1.5, '& li': { mb: 0.3 } }}>
                            {(s.regras || []).map((r, i) => (
                              <Typography component="li" variant="body2" key={i}>{r}</Typography>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Nenhuma regra cadastrada</Typography>
                        )}
                        <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#f59e0b' }}>Especialidades:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(s.especialidades || []).map((esp, i) => (
                            <Chip key={i} label={esp} size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontSize: '0.7rem' }} />
                          ))}
                          {(s.especialidades || []).length === 0 && (
                            <Typography variant="body2" color="text.secondary">Nenhuma especialidade</Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </>
        )}
      </TabPanel>

      {/* Dialogs */}
      <SeguradoraFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingSeguradora(null) }}
        onSave={handleSave}
        seguradora={editingSeguradora}
        saving={saving}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingSeguradora(null) }}
        onConfirm={handleDelete}
        seguradora={deletingSeguradora}
        deleting={deleting}
      />

      <IAChatDialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        seguradora={chatSeguradora}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Box>
  )
}
