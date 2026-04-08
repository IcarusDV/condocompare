'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Autocomplete,
  Snackbar,
  Fade,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import InfoIcon from '@mui/icons-material/Info'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import SecurityIcon from '@mui/icons-material/Security'
import GavelIcon from '@mui/icons-material/Gavel'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ApartmentIcon from '@mui/icons-material/Apartment'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import LinkIcon from '@mui/icons-material/Link'
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn'
import AddIcon from '@mui/icons-material/Add'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import HistoryIcon from '@mui/icons-material/History'
import { iaService, ChatMessage, ChatResponse } from '@/services/iaService'
import { chatHistoryService, ChatConversation } from '@/services/chatHistoryService'
import { condominioService } from '@/services/condominioService'
import { CondominioListResponse } from '@/types'

type ContextType = 'geral' | 'cobertura' | 'franquia' | 'sinistro' | 'comparacao' | 'diagnostico' | 'condominio'

interface EnrichedMessage extends ChatMessage {
  timestamp: Date
  sources?: string[]
}

const contextOptions: { value: ContextType; label: string; icon: React.ReactNode; color: string; description: string }[] = [
  { value: 'geral', label: 'Geral', icon: <QuestionAnswerIcon />, color: '#6366f1', description: 'Perguntas gerais sobre seguros' },
  { value: 'cobertura', label: 'Coberturas', icon: <SecurityIcon />, color: '#3b82f6', description: 'Tipos de cobertura e proteção' },
  { value: 'franquia', label: 'Franquias', icon: <GavelIcon />, color: '#8b5cf6', description: 'Valores e regras de franquias' },
  { value: 'sinistro', label: 'Sinistros', icon: <ReportProblemIcon />, color: '#ef4444', description: 'Abertura e acompanhamento' },
  { value: 'comparacao', label: 'Comparação', icon: <CompareArrowsIcon />, color: '#10b981', description: 'Comparar orçamentos e propostas' },
  { value: 'diagnostico', label: 'Diagnóstico', icon: <AssessmentIcon />, color: '#f59e0b', description: 'Análise de cobertura e riscos' },
  { value: 'condominio', label: 'Condomínio', icon: <ApartmentIcon />, color: '#06b6d4', description: 'Dados que afetam o seguro' },
]

const suggestedQuestionsByContext: Record<ContextType, string[]> = {
  geral: [
    'O que é a cobertura de Responsabilidade Civil do Condomínio?',
    'Quais coberturas são obrigatórias por lei?',
    'Qual a diferença entre seguro do condomínio e seguro do apartamento?',
    'Como funciona o processo de renovação do seguro?',
  ],
  cobertura: [
    'O que cobre a cobertura de Danos Elétricos?',
    'Como funciona a cobertura de Vendaval?',
    'O que é cobertura de Responsabilidade Civil do Síndico?',
    'Quais coberturas protegem áreas comuns?',
  ],
  franquia: [
    'Como funciona a franquia em caso de sinistro?',
    'O que é franquia simples e franquia dedutível?',
    'Posso negociar o valor da franquia?',
    'Franquia mais alta reduz o prêmio?',
  ],
  sinistro: [
    'Como abrir um sinistro de danos elétricos?',
    'Quais documentos preciso para abrir um sinistro?',
    'Qual o prazo para a seguradora responder um sinistro?',
    'O que fazer imediatamente após um sinistro?',
  ],
  comparacao: [
    'Qual o critério mais importante ao comparar orçamentos?',
    'Devo escolher sempre o orçamento mais barato?',
    'Como avaliar se as coberturas estão adequadas?',
    'Quais cláusulas devo prestar atenção?',
  ],
  diagnostico: [
    'O que significa score de cobertura?',
    'Como melhorar a pontuação do meu condomínio?',
    'Quais coberturas são essenciais para um condomínio?',
    'O que são riscos críticos de cobertura?',
  ],
  condominio: [
    'Que informações do condomínio afetam o seguro?',
    'Condomínios antigos pagam mais caro?',
    'Estruturas como piscina aumentam o prêmio?',
    'Elevadores influenciam no valor do seguro?',
  ],
}

function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', py: 0.5 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 8, height: 8, borderRadius: '50%', bgcolor: '#94a3b8',
            animation: 'typingBounce 1.4s infinite ease-in-out',
            animationDelay: `${i * 0.2}s`,
            '@keyframes typingBounce': {
              '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
              '40%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        />
      ))}
    </Box>
  )
}

function formatMessageContent(content: string): React.ReactNode {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const formattedParts = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${lineIdx}-${partIdx}`}>{part.slice(2, -2)}</strong>
      }
      return part
    })

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <Box key={lineIdx} sx={{ display: 'flex', gap: 1, ml: 1, my: 0.3 }}>
          <Typography variant="body2" component="span" sx={{ color: '#6366f1', fontWeight: 700 }}>{'\u2022'}</Typography>
          <Typography variant="body2" component="span" sx={{ lineHeight: 1.6 }}>
            {formattedParts.map((p) => (typeof p === 'string' ? p.replace(/^[-*]\s/, '') : p))}
          </Typography>
        </Box>
      )
    } else if (line.trim().match(/^\d+\.\s/)) {
      const num = line.trim().match(/^(\d+)\.\s/)
      elements.push(
        <Box key={lineIdx} sx={{ display: 'flex', gap: 1, ml: 1, my: 0.3 }}>
          <Typography variant="body2" component="span" sx={{ color: '#6366f1', fontWeight: 700, minWidth: 16 }}>{num?.[1]}.</Typography>
          <Typography variant="body2" component="span" sx={{ lineHeight: 1.6 }}>
            {formattedParts.map((p) => (typeof p === 'string' ? p.replace(/^\d+\.\s/, '') : p))}
          </Typography>
        </Box>
      )
    } else if (line.trim() === '') {
      elements.push(<Box key={lineIdx} sx={{ height: 8 }} />)
    } else {
      elements.push(
        <Typography key={lineIdx} variant="body2" component="p" sx={{ lineHeight: 1.7, my: 0.2 }}>
          {formattedParts}
        </Typography>
      )
    }
  })

  return <>{elements}</>
}

export default function AssistentePage() {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<EnrichedMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contextType, setContextType] = useState<ContextType>('geral')
  const [copySnackbar, setCopySnackbar] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Conversation history
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  // Condominios
  const [condominios, setCondominios] = useState<CondominioListResponse[]>([])
  const [selectedCondominio, setSelectedCondominio] = useState<CondominioListResponse | null>(null)
  const [loadingCondominios, setLoadingCondominios] = useState(true)

  // IA Service status
  const [iaStatus, setIaStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // Load condominios
  useEffect(() => {
    const load = async () => {
      try {
        const data = await condominioService.list({}, { size: 100 })
        setCondominios(data.content)
      } catch {
        // silent
      } finally {
        setLoadingCondominios(false)
      }
    }
    load()
  }, [])

  // Check IA service health
  useEffect(() => {
    const check = async () => {
      try {
        await iaService.healthCheck()
        setIaStatus('online')
      } catch {
        setIaStatus('offline')
      }
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [])

  // Load conversation history
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const convs = await chatHistoryService.listConversations()
      setConversations(convs)
    } catch {
      // silent - history is optional
    }
  }

  // Read context from URL params
  useEffect(() => {
    const ctx = searchParams.get('context') as ContextType | null
    const pergunta = searchParams.get('q')

    if (ctx && contextOptions.some((opt) => opt.value === ctx)) {
      setContextType(ctx)
    }
    if (pergunta) {
      const decoded = decodeURIComponent(pergunta)
      setInput(decoded)
      setTimeout(() => {
        if (decoded.trim()) {
          handleSendMessage(decoded.trim(), ctx || 'geral')
        }
      }, 500)
    }
  }, [searchParams])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSendMessage = async (messageText?: string, ctx?: ContextType) => {
    const text = messageText || input.trim()
    if (!text || loading) return

    const userMessage: EnrichedMessage = { role: 'user', content: text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    // Create or use existing conversation
    let convId = activeConversationId
    if (!convId) {
      try {
        const conv = await chatHistoryService.createConversation({
          contextType: ctx || contextType,
          condominioId: selectedCondominio?.id,
        })
        convId = conv.id
        setActiveConversationId(conv.id)
        setConversations((prev) => [conv, ...prev])
      } catch {
        // Continue without persistence
      }
    }

    // Save user message
    if (convId) {
      try {
        await chatHistoryService.addMessage(convId, { role: 'user', content: text })
      } catch { /* silent */ }
    }

    try {
      const history = messages.map(({ role, content }) => ({ role, content }))
      const response: ChatResponse = await iaService.chat({
        message: text,
        history,
        context_type: ctx || contextType,
        condominio_id: selectedCondominio?.id,
      })

      const assistantMessage: EnrichedMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        sources: response.sources?.length > 0 ? response.sources : undefined,
      }
      setMessages((prev) => [...prev, assistantMessage])

      // Save assistant message
      if (convId) {
        try {
          await chatHistoryService.addMessage(convId, {
            role: 'assistant',
            content: response.response,
            sources: response.sources?.length > 0 ? response.sources.join('|||') : undefined,
          })
        } catch { /* silent */ }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Erro ao enviar mensagem. Verifique se o serviço de IA está rodando.')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleSend = () => handleSendMessage()

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question)
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    setCopySnackbar(true)
  }

  const handleNewChat = () => {
    setMessages([])
    setActiveConversationId(null)
    setError(null)
    inputRef.current?.focus()
  }

  const handleLoadConversation = async (conv: ChatConversation) => {
    setLoadingHistory(true)
    try {
      const msgs = await chatHistoryService.getMessages(conv.id)
      const enriched: EnrichedMessage[] = msgs.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.createdAt),
        sources: m.sources ? m.sources.split('|||') : undefined,
      }))
      setMessages(enriched)
      setActiveConversationId(conv.id)
      if (conv.contextType) {
        setContextType(conv.contextType as ContextType)
      }
    } catch {
      setError('Erro ao carregar conversa')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await chatHistoryService.deleteConversation(convId)
      setConversations((prev) => prev.filter((c) => c.id !== convId))
      if (activeConversationId === convId) {
        handleNewChat()
      }
    } catch { /* silent */ }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return 'Hoje'
    if (diff < 172800000) return 'Ontem'
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const currentCtx = contextOptions.find((o) => o.value === contextType) || contextOptions[0]

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" fontWeight="bold">Assistente IA</Typography>
            <Tooltip title={iaStatus === 'online' ? 'Serviço de IA online' : iaStatus === 'offline' ? 'Serviço de IA offline' : 'Verificando conexão...'}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: 10, bgcolor: iaStatus === 'online' ? '#dcfce7' : iaStatus === 'offline' ? '#fee2e2' : '#f1f5f9', border: `1px solid ${iaStatus === 'online' ? '#bbf7d0' : iaStatus === 'offline' ? '#fecaca' : '#e2e8f0'}` }}>
                {iaStatus === 'checking' ? (
                  <CircularProgress size={10} sx={{ color: '#94a3b8' }} />
                ) : iaStatus === 'online' ? (
                  <CheckCircleIcon sx={{ fontSize: 14, color: '#22c55e' }} />
                ) : (
                  <ErrorIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                )}
                <Typography variant="caption" fontWeight={600} sx={{ color: iaStatus === 'online' ? '#16a34a' : iaStatus === 'offline' ? '#dc2626' : '#64748b' }}>
                  {iaStatus === 'online' ? 'Online' : iaStatus === 'offline' ? 'Offline' : '...'}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tire suas dúvidas sobre seguros de condomínio com nosso assistente inteligente
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={showSidebar ? 'Ocultar histórico' : 'Mostrar histórico'}>
            <IconButton onClick={() => setShowSidebar(!showSidebar)} size="small" sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <HistoryIcon sx={{ fontSize: 20, color: '#64748b' }} />
            </IconButton>
          </Tooltip>
          {messages.length > 0 && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleNewChat} size="small" sx={{ borderColor: '#e2e8f0', color: '#64748b', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
              Nova Conversa
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Context Selector + Condominio */}
      <Paper sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Contexto da conversa
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
              {contextOptions.map((option) => {
                const isSelected = contextType === option.value
                return (
                  <Chip
                    key={option.value}
                    icon={<Box sx={{ display: 'flex', '& > svg': { fontSize: 16, color: isSelected ? 'white' : option.color } }}>{option.icon}</Box>}
                    label={option.label}
                    onClick={() => setContextType(option.value)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isSelected ? option.color : `${option.color}08`,
                      color: isSelected ? 'white' : '#334155',
                      border: `1px solid ${isSelected ? option.color : `${option.color}30`}`,
                      fontWeight: isSelected ? 700 : 500,
                      '&:hover': { bgcolor: isSelected ? option.color : `${option.color}15` },
                      transition: 'all 0.2s',
                    }}
                  />
                )
              })}
            </Box>
          </Box>

          <Box sx={{ minWidth: 280 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Condomínio (opcional)
            </Typography>
            <Autocomplete
              size="small"
              options={condominios}
              getOptionLabel={(option) => option.nome}
              value={selectedCondominio}
              onChange={(_, value) => setSelectedCondominio(value)}
              loading={loadingCondominios}
              renderInput={(params) => (
                <TextField {...params} placeholder="Selecionar condomínio..." sx={{ mt: 1 }} />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ApartmentIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{option.nome}</Typography>
                      {option.cidade && (
                        <Typography variant="caption" color="text.secondary">{option.cidade}/{option.estado}</Typography>
                      )}
                    </Box>
                  </Box>
                </li>
              )}
              noOptionsText="Nenhum condomínio encontrado"
            />
          </Box>
        </Box>
      </Paper>

      {/* Main Content with Sidebar */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, overflow: 'hidden' }}>
        {/* Conversation History Sidebar */}
        {showSidebar && (
          <Paper sx={{ width: 280, flexShrink: 0, border: '1px solid #e2e8f0', boxShadow: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#334155' }}>
                Histórico de Conversas
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {conversations.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 32, color: '#cbd5e1', mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Nenhuma conversa salva
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {conversations.map((conv) => (
                    <ListItemButton
                      key={conv.id}
                      selected={activeConversationId === conv.id}
                      onClick={() => handleLoadConversation(conv)}
                      sx={{
                        py: 1.5, px: 2, borderBottom: '1px solid #f1f5f9',
                        '&.Mui-selected': { bgcolor: '#ede9fe', '&:hover': { bgcolor: '#e0e7ff' } },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: activeConversationId === conv.id ? '#6366f1' : '#94a3b8' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={conv.titulo || 'Nova conversa'}
                        secondary={`${formatDate(conv.updatedAt)} · ${conv.messageCount} msgs`}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: activeConversationId === conv.id ? 600 : 400, noWrap: true, sx: { fontSize: '0.8rem' } }}
                        secondaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.65rem' } }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        sx={{ p: 0.3, opacity: 0.4, '&:hover': { opacity: 1, color: '#ef4444' } }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        )}

        {/* Chat Area */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          {loadingHistory ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={32} sx={{ color: '#6366f1' }} />
            </Box>
          ) : (
            <>
              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.length === 0 ? (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${currentCtx.color}20 0%, ${currentCtx.color}40 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                    }}>
                      <SmartToyIcon sx={{ fontSize: 36, color: currentCtx.color }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5, color: '#1e293b' }}>
                      CondoCompare IA
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center', maxWidth: 400 }}>
                      Especialista em seguros de condomínio. Pergunte sobre coberturas, franquias, sinistros e muito mais.
                    </Typography>
                    {selectedCondominio && (
                      <Chip
                        icon={<ApartmentIcon sx={{ fontSize: 16 }} />}
                        label={`Contexto: ${selectedCondominio.nome}`}
                        size="small"
                        sx={{ mb: 2, bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 600 }}
                      />
                    )}
                    <Box sx={{
                      px: 3, py: 1.5, borderRadius: 2, mb: 3,
                      bgcolor: `${currentCtx.color}08`, border: `1px solid ${currentCtx.color}20`,
                      display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                      <Box sx={{ color: currentCtx.color, display: 'flex' }}>{currentCtx.icon}</Box>
                      <Typography variant="body2" sx={{ color: currentCtx.color, fontWeight: 500 }}>
                        {currentCtx.label}: {currentCtx.description}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', maxWidth: 700 }}>
                      {suggestedQuestionsByContext[contextType].map((question, idx) => (
                        <Paper
                          key={idx}
                          onClick={() => handleSuggestedQuestion(question)}
                          sx={{
                            p: 2, cursor: 'pointer', flex: '1 1 calc(50% - 12px)', minWidth: 250,
                            border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 2,
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: currentCtx.color, bgcolor: `${currentCtx.color}05`, transform: 'translateY(-1px)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <AutoAwesomeIcon sx={{ fontSize: 18, color: currentCtx.color, mt: 0.2, flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.5 }}>{question}</Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isUser = message.role === 'user'
                      return (
                        <Fade in key={index} timeout={300}>
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                            <Avatar sx={{
                              width: 34, height: 34, mt: 0.3,
                              bgcolor: isUser ? '#6366f1' : `${currentCtx.color}15`,
                              color: isUser ? 'white' : currentCtx.color,
                            }}>
                              {isUser ? <PersonIcon sx={{ fontSize: 18 }} /> : <SmartToyIcon sx={{ fontSize: 18 }} />}
                            </Avatar>
                            <Box sx={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                              <Paper sx={{
                                p: 2, boxShadow: 'none',
                                bgcolor: isUser ? '#6366f1' : '#f8fafc',
                                color: isUser ? 'white' : '#334155',
                                border: isUser ? 'none' : '1px solid #e2e8f0',
                                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              }}>
                                {isUser ? (
                                  <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
                                ) : (
                                  <Box sx={{ '& p': { m: 0 } }}>{formatMessageContent(message.content)}</Box>
                                )}
                              </Paper>

                              {!isUser && message.sources && message.sources.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                  <LinkIcon sx={{ fontSize: 14, color: '#94a3b8', mt: 0.3 }} />
                                  {message.sources.map((source, sIdx) => (
                                    <Chip key={sIdx} label={source} size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: '#f1f5f9', color: '#64748b' }} />
                                  ))}
                                </Box>
                              )}

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>{formatTime(message.timestamp)}</Typography>
                                {!isUser && (
                                  <Tooltip title="Copiar resposta">
                                    <IconButton size="small" onClick={() => handleCopyMessage(message.content)} sx={{ p: 0.3, color: '#94a3b8', '&:hover': { color: '#6366f1' } }}>
                                      <ContentCopyIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </Fade>
                      )
                    })}

                    {loading && (
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: `${currentCtx.color}15`, color: currentCtx.color }}>
                          <SmartToyIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Paper sx={{ px: 2.5, py: 1.5, boxShadow: 'none', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px 16px 16px 4px' }}>
                          <TypingIndicator />
                        </Paper>
                      </Box>
                    )}

                    {!loading && messages.length > 0 && messages.length < 6 && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 6 }}>
                        {suggestedQuestionsByContext[contextType].slice(0, 2).map((q, i) => (
                          <Chip
                            key={i} label={q} size="small" variant="outlined"
                            onClick={() => handleSuggestedQuestion(q)}
                            sx={{
                              cursor: 'pointer', height: 'auto', maxWidth: '100%',
                              borderColor: '#e2e8f0', color: '#64748b',
                              '& .MuiChip-label': { whiteSpace: 'normal', py: 0.75, fontSize: '0.75rem' },
                              '&:hover': { borderColor: currentCtx.color, color: currentCtx.color, bgcolor: `${currentCtx.color}05` },
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input Area */}
              <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#fafbfc' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth multiline maxRows={4}
                    placeholder={iaStatus === 'offline' ? 'Serviço de IA indisponível...' : `Pergunte sobre ${currentCtx.label.toLowerCase()}...`}
                    value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown} disabled={loading || iaStatus === 'offline'}
                    inputRef={inputRef} size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3, bgcolor: 'white',
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentCtx.color },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: currentCtx.color },
                      },
                    }}
                  />
                  <IconButton
                    onClick={handleSend} disabled={!input.trim() || loading || iaStatus === 'offline'}
                    sx={{
                      width: 44, height: 44, borderRadius: 3,
                      bgcolor: input.trim() ? currentCtx.color : '#e2e8f0', color: 'white',
                      '&:hover': { bgcolor: currentCtx.color, filter: 'brightness(0.9)' },
                      '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
                      transition: 'all 0.2s',
                    }}
                  >
                    {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SendIcon sx={{ fontSize: 20 }} />}
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <InfoIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                      As respostas são geradas por IA. Consulte um corretor especializado para decisões finais.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <KeyboardReturnIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Enter para enviar</Typography>
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Box>

      <Snackbar
        open={copySnackbar} autoHideDuration={2000}
        onClose={() => setCopySnackbar(false)} message="Resposta copiada!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
