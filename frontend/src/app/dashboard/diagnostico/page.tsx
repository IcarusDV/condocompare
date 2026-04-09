'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Skeleton,
  Collapse,
  IconButton,
  Tooltip,
  LinearProgress,
  Checkbox as MuiCheckbox,
  Snackbar,
} from '@mui/material'
import Checkbox from '@mui/material/Checkbox'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import SecurityIcon from '@mui/icons-material/Security'
import ApartmentIcon from '@mui/icons-material/Apartment'
import ShieldIcon from '@mui/icons-material/Shield'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import RefreshIcon from '@mui/icons-material/Refresh'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices'
import RoofingIcon from '@mui/icons-material/Roofing'
import DoorSlidingIcon from '@mui/icons-material/DoorSliding'
import WindowIcon from '@mui/icons-material/Window'
import FireExtinguisherIcon from '@mui/icons-material/FireExtinguisher'
import GavelIcon from '@mui/icons-material/Gavel'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ShareIcon from '@mui/icons-material/Share'
import HistoryIcon from '@mui/icons-material/History'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { useRouter } from 'next/navigation'
import { condominioService } from '@/services/condominioService'
import { documentoService } from '@/services/documentoService'
import { iaService, DiagnosticoResponse } from '@/services/iaService'
import { CondominioListResponse, DocumentoListResponse, CoberturaDTO, CondominioResponse } from '@/types'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts'

// ─── Constants ───────────────────────────────────────────────────────

const COBERTURAS_OBRIGATORIAS = [
  'incendio', 'raio', 'explosao', 'incendio, raio e explosao',
]

const HISTORY_KEY = 'condocompare_diagnostico_history'
const CHECKLIST_KEY = 'condocompare_diagnostico_checklist'
const MAX_VISIBLE_COBERTURAS = 5

interface DiagnosticoHistoryEntry {
  condominioId: string
  condominioNome: string
  score: number
  status: string
  date: string
  adequadas: number
  insuficientes: number
  ausentes: number
}

// ─── Helpers ─────────────────────────────────────────────────────────

const getStatusGradient = (status: string) => {
  switch (status) {
    case 'adequado': return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
    case 'atencao': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    case 'critico': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    default: return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'adequado': return 'Cobertura Adequada'
    case 'atencao': return 'Requer Atenção'
    case 'critico': return 'Situação Crítica'
    default: return 'Analisando...'
  }
}

const getSeveridadeColor = (severidade: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (severidade) {
    case 'alta': return 'error'
    case 'media': return 'warning'
    case 'baixa': return 'info'
    default: return 'default'
  }
}

const getSeveridadeBgColor = (severidade: string) => {
  switch (severidade) {
    case 'alta': return { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: '#ef4444' }
    case 'media': return { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '#f59e0b' }
    case 'baixa': return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: '#3b82f6' }
    default: return { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', icon: '#64748b' }
  }
}

const getRiscoIcon = (risco: string, size = 32) => {
  const lower = risco.toLowerCase()
  const sx = { fontSize: size }
  if (lower.includes('incendio') || lower.includes('fogo')) return <LocalFireDepartmentIcon sx={sx} />
  if (lower.includes('agua') || lower.includes('hidra') || lower.includes('inunda') || lower.includes('vazamento')) return <WaterDropIcon sx={sx} />
  if (lower.includes('eletric') || lower.includes('energia') || lower.includes('curto')) return <ElectricalServicesIcon sx={sx} />
  if (lower.includes('telhado') || lower.includes('cobertura') || lower.includes('estrutur')) return <RoofingIcon sx={sx} />
  if (lower.includes('porta') || lower.includes('acesso') || lower.includes('portaria')) return <DoorSlidingIcon sx={sx} />
  if (lower.includes('janela') || lower.includes('vidro') || lower.includes('fachada')) return <WindowIcon sx={sx} />
  if (lower.includes('extintor') || lower.includes('brigada') || lower.includes('combate')) return <FireExtinguisherIcon sx={sx} />
  if (lower.includes('legal') || lower.includes('civil') || lower.includes('responsabilidade')) return <GavelIcon sx={sx} />
  return <SecurityIcon sx={sx} />
}

const getCoberturaIcon = (nome: string) => {
  const lower = nome.toLowerCase()
  if (lower.includes('incendio') || lower.includes('raio') || lower.includes('explosao')) return <LocalFireDepartmentIcon sx={{ fontSize: 16 }} />
  if (lower.includes('agua') || lower.includes('inundacao') || lower.includes('alagamento')) return <WaterDropIcon sx={{ fontSize: 16 }} />
  if (lower.includes('eletric') || lower.includes('dano') && lower.includes('elet')) return <ElectricalServicesIcon sx={{ fontSize: 16 }} />
  if (lower.includes('vidro')) return <WindowIcon sx={{ fontSize: 16 }} />
  if (lower.includes('civil') || lower.includes('responsabilidade')) return <GavelIcon sx={{ fontSize: 16 }} />
  if (lower.includes('roubo') || lower.includes('furto')) return <SecurityIcon sx={{ fontSize: 16 }} />
  if (lower.includes('vendaval') || lower.includes('granizo')) return <RoofingIcon sx={{ fontSize: 16 }} />
  return <ShieldIcon sx={{ fontSize: 16 }} />
}

const isObrigatoria = (nome: string) => {
  const lower = nome.toLowerCase()
  return COBERTURAS_OBRIGATORIAS.some(ob => lower.includes(ob))
}

const getScoreBarColor = (score: number) => {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

// ─── localStorage helpers ────────────────────────────────────────────

const loadHistory = (): DiagnosticoHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

const saveHistory = (history: DiagnosticoHistoryEntry[]) => {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20))) } catch {}
}

const loadChecklist = (condominioId: string): Record<number, boolean> => {
  try {
    const stored = localStorage.getItem(`${CHECKLIST_KEY}_${condominioId}`)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

const saveChecklist = (condominioId: string, checked: Record<number, boolean>) => {
  try { localStorage.setItem(`${CHECKLIST_KEY}_${condominioId}`, JSON.stringify(checked)) } catch {}
}

// ═════════════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════════════

export default function DiagnosticoPage() {
  const router = useRouter()

  // Core state
  const [condominios, setCondominios] = useState<CondominioListResponse[]>([])
  const [selectedCondominio, setSelectedCondominio] = useState<string>('')
  const [condominioDetails, setCondominioDetails] = useState<CondominioResponse | null>(null)
  const [orcamentos, setOrcamentos] = useState<DocumentoListResponse[]>([])
  const [selectedOrcamentos, setSelectedOrcamentos] = useState<string[]>([])
  const [totalCoberturas, setTotalCoberturas] = useState<number>(0)
  const [diagnostico, setDiagnostico] = useState<DiagnosticoResponse | null>(null)
  const [aggregatedCoberturas, setAggregatedCoberturas] = useState<CoberturaDTO[]>([])

  // Loading states
  const [loadingCondominios, setLoadingCondominios] = useState(true)
  const [loadingOrcamentos, setLoadingOrcamentos] = useState(false)
  const [loadingDiagnostico, setLoadingDiagnostico] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // UI: Score animation
  const [animatedScore, setAnimatedScore] = useState(0)

  // UI: Collapse coberturas
  const [showAllAdequadas, setShowAllAdequadas] = useState(false)
  const [showAllInsuficientes, setShowAllInsuficientes] = useState(false)
  const [showAllAusentes, setShowAllAusentes] = useState(false)
  const [expandedCob, setExpandedCob] = useState<string | null>(null)

  // UI: Sticky bar
  const [showStickyBar, setShowStickyBar] = useState(false)
  const scoreRef = useRef<HTMLDivElement>(null)

  // Feature: Historico
  const [diagnosticoHistory, setDiagnosticoHistory] = useState<DiagnosticoHistoryEntry[]>([])

  // Feature: Plano de Acao checklist
  const [checkedRecs, setCheckedRecs] = useState<Record<number, boolean>>({})

  // Feature: Cost estimate
  const [estimatingCost, setEstimatingCost] = useState(false)
  const [costEstimate, setCostEstimate] = useState<string | null>(null)

  // Feature: Snackbar
  const [snackbar, setSnackbar] = useState<string | null>(null)

  // ─── Effects ─────────────────────────────────────────────────────

  // Load condominios
  useEffect(() => {
    const load = async () => {
      try {
        const response = await condominioService.list({}, { size: 100 })
        setCondominios(response.content)
      } catch { setError('Erro ao carregar condomínios') }
      finally { setLoadingCondominios(false) }
    }
    load()
  }, [])

  // Load history from localStorage
  useEffect(() => {
    setDiagnosticoHistory(loadHistory())
  }, [])

  // On condominio change
  useEffect(() => {
    if (!selectedCondominio) {
      setOrcamentos([])
      setSelectedOrcamentos([])
      setDiagnostico(null)
      setCondominioDetails(null)
      setAggregatedCoberturas([])
      setCostEstimate(null)
      return
    }
    const loadData = async () => {
      try {
        setLoadingDetails(true)
        setLoadingOrcamentos(true)
        const details = await condominioService.getById(selectedCondominio)
        setCondominioDetails(details)
        const response = await documentoService.listByCondominioAndTipo(selectedCondominio, 'ORCAMENTO')
        setOrcamentos(response.filter((o) => o.status === 'CONCLUIDO'))
        setSelectedOrcamentos([])
        setDiagnostico(null)
        setAggregatedCoberturas([])
        setCostEstimate(null)
        setCheckedRecs(loadChecklist(selectedCondominio))
      } catch { /* ignore */ }
      finally { setLoadingDetails(false); setLoadingOrcamentos(false) }
    }
    loadData()
  }, [selectedCondominio])

  // Check coberturas count
  useEffect(() => {
    if (selectedOrcamentos.length === 0) { setTotalCoberturas(0); return }
    const check = async () => {
      try {
        let total = 0
        for (const orcId of selectedOrcamentos) {
          const doc = await documentoService.getById(orcId)
          const dados = doc.dadosExtraidos as { coberturas?: CoberturaDTO[] } | undefined
          total += (dados?.coberturas || []).length
        }
        setTotalCoberturas(total)
      } catch { setTotalCoberturas(0) }
    }
    check()
  }, [selectedOrcamentos])

  // Score countUp animation
  useEffect(() => {
    if (!diagnostico) { setAnimatedScore(0); return }
    const target = Math.round(diagnostico.score)
    let current = 0
    const step = Math.max(1, Math.floor(target / 40))
    const timer = setInterval(() => {
      current += step
      if (current >= target) { current = target; clearInterval(timer) }
      setAnimatedScore(current)
    }, 25)
    return () => clearInterval(timer)
  }, [diagnostico])

  // Sticky bar via IntersectionObserver
  useEffect(() => {
    if (!scoreRef.current || !diagnostico) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(scoreRef.current)
    return () => observer.disconnect()
  }, [diagnostico])

  // ─── Handlers ────────────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (!selectedCondominio) { setError('Selecione um condomínio'); return }
    try {
      setLoadingDiagnostico(true)
      setError(null)
      setCostEstimate(null)

      let coberturas: CoberturaDTO[] = []
      const dadosOrcamentos: Array<Record<string, unknown>> = []
      for (const orcId of selectedOrcamentos) {
        const doc = await documentoService.getById(orcId)
        const dados = doc.dadosExtraidos as { coberturas?: CoberturaDTO[]; condicoesEspeciais?: string[]; descontos?: number; formaPagamento?: string; observacoesInternas?: string } | undefined
        const orcCoberturas = dados?.coberturas || []
        orcCoberturas.forEach((c) => {
          const existing = coberturas.find((e) => e.nome === c.nome)
          if (existing) {
            if ((c.valorLimite || 0) > (existing.valorLimite || 0)) existing.valorLimite = c.valorLimite
          } else {
            coberturas.push({ ...c })
          }
        })
        // Collect full orcamento data for IA context
        dadosOrcamentos.push({
          id: doc.id,
          seguradora: doc.seguradoraNome,
          valorPremio: doc.valorPremio,
          dataVigenciaInicio: doc.dataVigenciaInicio,
          dataVigenciaFim: doc.dataVigenciaFim,
          coberturas: orcCoberturas.map((c) => ({
            nome: c.nome, valorLimite: c.valorLimite, franquia: c.franquia, incluido: c.incluido,
          })),
          condicoesEspeciais: dados?.condicoesEspeciais,
          formaPagamento: dados?.formaPagamento,
          descontos: dados?.descontos,
          observacoes: dados?.observacoesInternas,
        })
      }
      setAggregatedCoberturas(coberturas)

      // Build comprehensive condominio data for IA analysis
      const dadosCondominio: Record<string, unknown> = condominioDetails ? {
        nome: condominioDetails.nome,
        cnpj: condominioDetails.cnpj,
        endereco: condominioDetails.endereco ? `${condominioDetails.endereco.endereco || ''}, ${condominioDetails.endereco.numero || ''} - ${condominioDetails.endereco.bairro || ''}, ${condominioDetails.endereco.cidade || ''}/${condominioDetails.endereco.estado || ''}` : undefined,
        // Caracteristicas do edificio
        tipoConstrucao: condominioDetails.caracteristicas?.tipoConstrucao,
        numeroUnidades: condominioDetails.caracteristicas?.numeroUnidades,
        numeroBlocos: condominioDetails.caracteristicas?.numeroBlocos,
        numeroAndares: condominioDetails.caracteristicas?.numeroAndares,
        numeroElevadores: condominioDetails.caracteristicas?.numeroElevadores,
        areaConstruida: condominioDetails.caracteristicas?.areaConstruida,
        areaTotal: condominioDetails.caracteristicas?.areaTotal,
        anoConstrucao: condominioDetails.caracteristicas?.anoConstrucao,
        numeroFuncionarios: condominioDetails.caracteristicas?.numeroFuncionarios,
        // Estrutura e amenidades
        temPiscina: condominioDetails.amenidades?.temPiscina,
        temAcademia: condominioDetails.amenidades?.temAcademia,
        temSalaoFestas: condominioDetails.amenidades?.temSalaoFestas,
        temPlayground: condominioDetails.amenidades?.temPlayground,
        temChurrasqueira: condominioDetails.amenidades?.temChurrasqueira,
        temQuadra: condominioDetails.amenidades?.temQuadra,
        temPortaria24h: condominioDetails.amenidades?.temPortaria24h,
        temPlacasSolares: condominioDetails.amenidades?.temPlacasSolares,
        possuiAreaComercial: condominioDetails.amenidades?.possuiAreaComercial,
        tamanhoAreaComercial: condominioDetails.amenidades?.tamanhoAreaComercial,
        numPavimentos: condominioDetails.amenidades?.numPavimentos,
        possuiGaragem: condominioDetails.amenidades?.possuiGaragem,
        vagasGaragem: condominioDetails.amenidades?.vagasGaragem,
        espacosConveniencia: condominioDetails.amenidades?.espacosConveniencia,
        sistemaProtecaoIncendio: condominioDetails.amenidades?.sistemaProtecaoIncendio,
        possuiRecargaEletricos: condominioDetails.amenidades?.possuiRecargaEletricos,
        possuiBicicletario: condominioDetails.amenidades?.possuiBicicletario,
        numFuncionariosRegistrados: condominioDetails.amenidades?.numFuncionariosRegistrados,
        idadeFuncionariosRegistrados: condominioDetails.amenidades?.idadeFuncionariosRegistrados,
        // Seguro atual
        seguradoraAtual: condominioDetails.seguro?.seguradoraAtual,
        vencimentoApolice: condominioDetails.seguro?.vencimentoApolice,
        diasParaVencimento: condominioDetails.seguro?.diasParaVencimento,
      } : {}

      const result = await iaService.analyzeDiagnostico({
        condominio_id: selectedCondominio,
        coberturas: coberturas.map((c) => ({
          nome: c.nome, valorLimite: c.valorLimite, franquia: c.franquia, incluido: c.incluido,
        })),
        dados_condominio: dadosCondominio,
        dados_orcamentos: dadosOrcamentos.length > 0 ? dadosOrcamentos : undefined,
      })
      setDiagnostico(result)

      // Save to history
      const entry: DiagnosticoHistoryEntry = {
        condominioId: selectedCondominio,
        condominioNome: result.condominio_nome || condominioDetails?.nome || '',
        score: Math.round(result.score),
        status: result.status,
        date: new Date().toISOString(),
        adequadas: result.coberturas_adequadas.length,
        insuficientes: result.coberturas_insuficientes.length,
        ausentes: result.coberturas_ausentes.length,
      }
      const newHistory = [entry, ...diagnosticoHistory.filter(h =>
        !(h.condominioId === entry.condominioId && h.date.slice(0, 10) === entry.date.slice(0, 10))
      )].slice(0, 20)
      setDiagnosticoHistory(newHistory)
      saveHistory(newHistory)

      // Load checklist
      setCheckedRecs(loadChecklist(selectedCondominio))
    } catch {
      setError('Erro ao gerar diagnóstico. Verifique se o serviço de IA está rodando.')
    } finally {
      setLoadingDiagnostico(false)
    }
  }, [selectedCondominio, selectedOrcamentos, condominioDetails, diagnosticoHistory])

  const handleExportPDF = async () => {
    if (!diagnostico) return
    try {
      setLoadingReport(true)
      setError(null)
      const reportData = await iaService.generateReport({
        condominio_nome: diagnostico.condominio_nome,
        condominio_id: selectedCondominio,
        score: diagnostico.score,
        status: diagnostico.status,
        coberturas_adequadas: diagnostico.coberturas_adequadas,
        coberturas_insuficientes: diagnostico.coberturas_insuficientes,
        coberturas_ausentes: diagnostico.coberturas_ausentes,
        recomendacoes: diagnostico.recomendacoes,
        riscos_identificados: diagnostico.riscos_identificados,
        dados_condominio: condominioDetails ? {
          tipo: condominioDetails.caracteristicas?.tipoConstrucao,
          unidades: condominioDetails.caracteristicas?.numeroUnidades,
          blocos: condominioDetails.caracteristicas?.numeroBlocos,
          andares: condominioDetails.caracteristicas?.numeroAndares,
          elevadores: condominioDetails.caracteristicas?.numeroElevadores,
          area: condominioDetails.caracteristicas?.areaConstruida,
          anoConstrucao: condominioDetails.caracteristicas?.anoConstrucao,
          piscina: condominioDetails.amenidades?.temPiscina,
          academia: condominioDetails.amenidades?.temAcademia,
          portaria24h: condominioDetails.amenidades?.temPortaria24h,
          areaComercial: condominioDetails.amenidades?.possuiAreaComercial,
          garagem: condominioDetails.amenidades?.possuiGaragem,
          vagasGaragem: condominioDetails.amenidades?.vagasGaragem,
          protecaoIncendio: condominioDetails.amenidades?.sistemaProtecaoIncendio,
          seguradoraAtual: condominioDetails.seguro?.seguradoraAtual,
          vencimentoApolice: condominioDetails.seguro?.vencimentoApolice,
        } : {},
      })
      if (!reportData.success || !reportData.relatorio_markdown) {
        setError('Erro ao gerar relatório. Tente novamente.')
        return
      }
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const markdown = reportData.relatorio_markdown
      const lines = markdown.split('\n')
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      const maxWidth = pageWidth - margin * 2
      let y = 20

      const addPage = () => { doc.addPage(); y = 20 }
      const checkPage = (needed: number) => { if (y + needed > doc.internal.pageSize.getHeight() - 20) addPage() }

      doc.setFillColor(99, 102, 241)
      doc.rect(0, 0, pageWidth, 12, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.text('CondoCompare - Relatório de Diagnóstico', margin, 8)
      doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - margin, 8, { align: 'right' })
      y = 20
      doc.setTextColor(0, 0, 0)

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) { y += 3; continue }
        checkPage(10)
        if (trimmed.startsWith('# ')) {
          y += 4; doc.setFontSize(18); doc.setFont('helvetica', 'bold')
          doc.text(trimmed.replace(/^# /, ''), margin, y); y += 10
        } else if (trimmed.startsWith('## ')) {
          y += 3; doc.setFontSize(14); doc.setFont('helvetica', 'bold')
          doc.text(trimmed.replace(/^## /, ''), margin, y); y += 8
        } else if (trimmed.startsWith('### ')) {
          y += 2; doc.setFontSize(12); doc.setFont('helvetica', 'bold')
          doc.text(trimmed.replace(/^### /, ''), margin, y); y += 7
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          doc.setFontSize(10); doc.setFont('helvetica', 'normal')
          const cleanText = trimmed.replace(/^[-*] /, '').replace(/\*\*/g, '')
          const wrapped = doc.splitTextToSize(`  • ${cleanText}`, maxWidth - 5)
          checkPage(wrapped.length * 5); doc.text(wrapped, margin + 3, y); y += wrapped.length * 5
        } else if (trimmed.startsWith('|')) {
          doc.setFontSize(9); doc.setFont('helvetica', 'normal')
          if (trimmed.includes('---')) continue
          const cellText = trimmed.split('|').filter(c => c.trim()).map(c => c.trim()).join('  |  ')
          const wrapped = doc.splitTextToSize(cellText, maxWidth)
          checkPage(wrapped.length * 4.5); doc.text(wrapped, margin, y); y += wrapped.length * 4.5
        } else {
          doc.setFontSize(10); doc.setFont('helvetica', 'normal')
          const wrapped = doc.splitTextToSize(trimmed.replace(/\*\*/g, ''), maxWidth)
          checkPage(wrapped.length * 5); doc.text(wrapped, margin, y); y += wrapped.length * 5
        }
      }
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        const pageHeight = doc.internal.pageSize.getHeight()
        doc.setFillColor(245, 245, 245)
        doc.rect(0, pageHeight - 10, pageWidth, 10, 'F')
        doc.setFontSize(7); doc.setTextColor(150, 150, 150)
        doc.text(`Gerado por CondoCompare IA - ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 4)
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 4, { align: 'right' })
      }
      const condName = diagnostico.condominio_nome || 'condominio'
      const date = new Date().toISOString().split('T')[0]
      doc.save(`diagnostico_${condName.replace(/\s+/g, '_')}_${date}.pdf`)
    } catch {
      setError('Erro ao gerar relatório PDF. Tente novamente.')
    } finally { setLoadingReport(false) }
  }

  const handleCopyResumo = () => {
    if (!diagnostico) return
    const text = [
      `DIAGNÓSTICO - ${diagnostico.condominio_nome || 'Condomínio'}`,
      `Score: ${Math.round(diagnostico.score)}/100 (${getStatusLabel(diagnostico.status)})`,
      `Coberturas Adequadas: ${diagnostico.coberturas_adequadas.length}`,
      `Coberturas Insuficientes: ${diagnostico.coberturas_insuficientes.length}`,
      `Coberturas Ausentes: ${diagnostico.coberturas_ausentes.length}`,
      '',
      'Recomendações:',
      ...diagnostico.recomendacoes.map((r, i) => `${i + 1}. [${r.tipo.toUpperCase()}] ${r.descricao}`),
      '',
      'Riscos:',
      ...diagnostico.riscos_identificados.map(r => `- [${r.severidade.toUpperCase()}] ${r.risco}: ${r.mitigacao}`),
    ].join('\n')
    navigator.clipboard.writeText(text).then(() => setSnackbar('Resumo copiado!'))
  }

  const handleShare = async () => {
    if (!diagnostico || !navigator.share) return
    try {
      await navigator.share({
        title: `Diagnóstico - ${diagnostico.condominio_nome}`,
        text: `Score: ${Math.round(diagnostico.score)}/100. ${diagnostico.coberturas_adequadas.length} adequadas, ${diagnostico.coberturas_insuficientes.length} insuficientes, ${diagnostico.coberturas_ausentes.length} ausentes.`,
      })
    } catch { /* cancelled */ }
  }

  const handleEstimateCost = async () => {
    if (!diagnostico) return
    try {
      setEstimatingCost(true)
      const ausentes = diagnostico.coberturas_ausentes.join(', ')
      const insuficientes = diagnostico.coberturas_insuficientes.join(', ')
      const result = await iaService.chat({
        message: `Com base neste diagnostico de seguro condominial, estime o custo adicional aproximado para adequar as coberturas. Coberturas ausentes: ${ausentes}. Coberturas insuficientes: ${insuficientes}. Condominio: ${condominioDetails?.caracteristicas?.tipoConstrucao || 'residencial'}, ${condominioDetails?.caracteristicas?.numeroUnidades || '?'} unidades, ${condominioDetails?.caracteristicas?.areaConstruida || '?'} m². Responda de forma concisa com valores estimados em reais.`,
        history: [],
        context_type: 'diagnostico',
        condominio_id: selectedCondominio,
      })
      setCostEstimate(result.response)
    } catch {
      setError('Erro ao estimar custos')
    } finally { setEstimatingCost(false) }
  }

  const handleToggleRec = (idx: number) => {
    const next = { ...checkedRecs, [idx]: !checkedRecs[idx] }
    setCheckedRecs(next)
    if (selectedCondominio) saveChecklist(selectedCondominio, next)
  }

  const handleClearHistory = () => {
    setDiagnosticoHistory([])
    saveHistory([])
    setSnackbar('Histórico limpo')
  }

  // ─── Derived data ────────────────────────────────────────────────

  const estruturaList = condominioDetails ? [
    { label: 'Piscina', active: condominioDetails.amenidades?.temPiscina },
    { label: 'Academia', active: condominioDetails.amenidades?.temAcademia },
    { label: 'Salão', active: condominioDetails.amenidades?.temSalaoFestas },
    { label: 'Elevadores', active: (condominioDetails.caracteristicas?.numeroElevadores || 0) > 0 },
    { label: 'Portaria 24h', active: condominioDetails.amenidades?.temPortaria24h },
    { label: 'Playground', active: condominioDetails.amenidades?.temPlayground },
    { label: 'Churrasqueira', active: condominioDetails.amenidades?.temChurrasqueira },
    { label: 'Quadra', active: condominioDetails.amenidades?.temQuadra },
    { label: 'Placas Solares', active: condominioDetails.amenidades?.temPlacasSolares },
    { label: 'Área Comercial', active: condominioDetails.amenidades?.possuiAreaComercial },
    { label: 'Garagem', active: condominioDetails.amenidades?.possuiGaragem },
    { label: 'Recarga Elétricos', active: condominioDetails.amenidades?.possuiRecargaEletricos },
    { label: 'Bicicletário', active: condominioDetails.amenidades?.possuiBicicletario },
    { label: 'Proteção Incêndio', active: (condominioDetails.amenidades?.sistemaProtecaoIncendio || []).length > 0 },
  ] : []

  // Compliance: coberturas obrigatorias ausentes
  const obrigatoriasAusentes = diagnostico
    ? diagnostico.coberturas_ausentes.filter(c => isObrigatoria(c))
    : []

  // Radar chart data
  const radarData = diagnostico ? (() => {
    const categories = [
      { name: 'Incendio', keys: ['incendio', 'raio', 'explosao'] },
      { name: 'RC', keys: ['responsabilidade', 'civil'] },
      { name: 'Elétricos', keys: ['eletric', 'energia'] },
      { name: 'Água', keys: ['agua', 'inunda', 'alagamento'] },
      { name: 'Vidros', keys: ['vidro', 'janela'] },
      { name: 'Roubo', keys: ['roubo', 'furto'] },
    ]
    return categories.map(cat => {
      const all = [...diagnostico.coberturas_adequadas, ...diagnostico.coberturas_insuficientes, ...diagnostico.coberturas_ausentes]
      const matching = all.filter(c => cat.keys.some(k => c.toLowerCase().includes(k)))
      const adequate = matching.filter(c => diagnostico.coberturas_adequadas.includes(c)).length
      const total = matching.length || 1
      return { category: cat.name, score: Math.round((adequate / total) * 100), ideal: 100 }
    })
  })() : []

  // History for this condominio (sparkline)
  const condHistory = diagnosticoHistory.filter(h => h.condominioId === selectedCondominio).reverse()

  // Previous score for comparison
  const previousScore = condHistory.length >= 2 ? condHistory[condHistory.length - 2].score : null
  const scoreDiff = previousScore !== null && diagnostico ? Math.round(diagnostico.score) - previousScore : null

  // Plano de Acao progress
  const totalRecs = diagnostico?.recomendacoes.length || 0
  const checkedCount = Object.values(checkedRecs).filter(Boolean).length
  const checkProgress = totalRecs > 0 ? (checkedCount / totalRecs) * 100 : 0

  // Find cobertura details
  const findCoberturaDetails = (nome: string) => aggregatedCoberturas.find(c => c.nome === nome)

  // ─── Render helpers ──────────────────────────────────────────────

  const renderCoberturaList = (
    items: string[],
    type: 'adequada' | 'insuficiente' | 'ausente',
    showAll: boolean,
    setShowAll: (v: boolean) => void,
  ) => {
    const colors = {
      adequada: { bg: '#f0fdf4', text: '#166534', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
      insuficiente: { bg: '#fffbeb', text: '#92400e', icon: <ArrowDownwardIcon sx={{ fontSize: 16 }} /> },
      ausente: { bg: '#fef2f2', text: '#991b1b', icon: <ErrorIcon sx={{ fontSize: 16 }} /> },
    }
    const c = colors[type]
    const visible = showAll ? items : items.slice(0, MAX_VISIBLE_COBERTURAS)
    const hidden = items.length - MAX_VISIBLE_COBERTURAS

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {visible.map((cob, idx) => {
          const details = findCoberturaDetails(cob)
          const obrigatoria = isObrigatoria(cob)
          const isExpanded = expandedCob === `${type}-${idx}`
          return (
            <Box key={idx}>
              <Chip
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {cob}
                    {obrigatoria && type === 'ausente' && (
                      <Chip label="OBRIGATÓRIO" size="small" sx={{
                        height: 16, fontSize: '0.55rem', fontWeight: 800, bgcolor: '#ef4444', color: 'white', ml: 0.5,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } },
                      }} />
                    )}
                  </Box>
                }
                size="small"
                icon={getCoberturaIcon(cob)}
                onClick={() => setExpandedCob(isExpanded ? null : `${type}-${idx}`)}
                sx={{
                  justifyContent: 'flex-start', bgcolor: c.bg, color: c.text, width: '100%',
                  cursor: 'pointer', '&:hover': { filter: 'brightness(0.95)' },
                  border: obrigatoria && type === 'ausente' ? '1px solid #ef4444' : 'none',
                }}
              />
              <Collapse in={isExpanded}>
                <Box sx={{ ml: 2, mt: 0.5, mb: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                  {details ? (
                    <>
                      {details.valorLimite && (
                        <Typography variant="caption" display="block"><strong>Limite:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(details.valorLimite)}</Typography>
                      )}
                      {details.franquia && (
                        <Typography variant="caption" display="block"><strong>Franquia:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(details.franquia)}</Typography>
                      )}
                      <Typography variant="caption" display="block"><strong>Incluído:</strong> {details.incluido ? 'Sim' : 'Não'}</Typography>
                    </>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {type === 'ausente' ? 'Cobertura não encontrada nos orçamentos selecionados' : 'Detalhes não disponíveis'}
                    </Typography>
                  )}
                  <Button
                    size="small" startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                    onClick={() => router.push(`/dashboard/assistente?context=cobertura&q=${encodeURIComponent(cob)}`)}
                    sx={{ mt: 0.5, fontSize: '0.7rem', textTransform: 'none', p: 0 }}
                  >
                    Perguntar a IA sobre esta cobertura
                  </Button>
                </Box>
              </Collapse>
            </Box>
          )
        })}
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            {type === 'adequada' ? 'Nenhuma avaliada como adequada' : type === 'insuficiente' ? 'Nenhuma com valor insuficiente' : 'Todas as coberturas presentes'}
          </Typography>
        )}
        {hidden > 0 && !showAll && (
          <Button size="small" endIcon={<ExpandMoreIcon />} onClick={() => setShowAll(true)}
            sx={{ textTransform: 'none', fontSize: '0.75rem', justifyContent: 'flex-start', color: c.text }}>
            Ver todas (+{hidden})
          </Button>
        )}
        {showAll && items.length > MAX_VISIBLE_COBERTURAS && (
          <Button size="small" endIcon={<ExpandLessIcon />} onClick={() => setShowAll(false)}
            sx={{ textTransform: 'none', fontSize: '0.75rem', justifyContent: 'flex-start', color: c.text }}>
            Mostrar menos
          </Button>
        )}
      </Box>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <Box>
      {/* ─── Header ─────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ShieldIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold">Diagnóstico Inteligente</Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Análise completa das coberturas do seu condomínio com recomendações baseadas em IA
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AutoAwesomeIcon />}
          onClick={() => router.push('/dashboard/assistente?context=diagnostico')}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
          Perguntar a IA
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ─── Compliance Alert (15) ──────────────────────────────── */}
      {diagnostico && obrigatoriasAusentes.length > 0 && (
        <Alert severity="error" sx={{ mb: 3, border: '1px solid #fca5a5' }} icon={<ReportProblemIcon />}>
          <strong>Coberturas obrigatórias ausentes:</strong> {obrigatoriasAusentes.join(', ')}.
          Estas coberturas são exigidas por lei e devem ser contratadas imediatamente.
        </Alert>
      )}
      {diagnostico && scoreDiff !== null && scoreDiff > 0 && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<TrendingUpIcon />}>
          Score melhorou <strong>{scoreDiff} pontos</strong> em relação à última análise deste condomínio.
        </Alert>
      )}
      {diagnostico && diagnostico.status === 'critico' && (
        <Alert severity="error" sx={{ mb: 3, fontWeight: 600 }}>
          Situação Crítica — Ação imediata recomendada. O score está abaixo de 40 pontos.
        </Alert>
      )}

      {/* ─── Selection Panel ────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="600" gutterBottom>Selecionar Condomínio</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel>Condomínio</InputLabel>
              <Select value={selectedCondominio} label="Condomínio" onChange={(e) => setSelectedCondominio(e.target.value)} disabled={loadingCondominios}>
                {condominios.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ApartmentIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                      {c.nome}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Orçamentos para análise (até 5)</Typography>
            {loadingOrcamentos ? <Skeleton variant="rounded" height={40} /> : orcamentos.length === 0 ? (
              <Alert severity="info" sx={{ py: 0.5 }}>{selectedCondominio ? 'Nenhum orçamento preenchido encontrado' : 'Selecione um condomínio'}</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {orcamentos.map((o) => {
                  const isSelected = selectedOrcamentos.includes(o.id)
                  return (
                    <Chip key={o.id} label={o.seguradoraNome || o.nome}
                      onClick={() => {
                        if (isSelected) setSelectedOrcamentos((prev) => prev.filter((id) => id !== o.id))
                        else if (selectedOrcamentos.length < 5) setSelectedOrcamentos((prev) => [...prev, o.id])
                      }}
                      color={isSelected ? 'primary' : 'default'} variant={isSelected ? 'filled' : 'outlined'}
                      icon={<Checkbox checked={isSelected} size="small" sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 } }} />}
                      sx={{ cursor: 'pointer' }}
                    />
                  )
                })}
              </Box>
            )}
            {selectedOrcamentos.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {selectedOrcamentos.length} orçamento(s) selecionado(s)
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="contained" fullWidth size="large"
              startIcon={loadingDiagnostico ? <CircularProgress size={20} color="inherit" /> : <AnalyticsIcon />}
              onClick={handleAnalyze} disabled={!selectedCondominio || loadingDiagnostico}
              sx={{ height: 56, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
              Analisar
            </Button>
          </Grid>
        </Grid>

        {selectedCondominio && selectedOrcamentos.length > 0 && totalCoberturas > 0 && (
          <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircleIcon />}>
            <strong>{totalCoberturas} coberturas encontradas</strong> nos {selectedOrcamentos.length} orçamento(s) selecionado(s).
          </Alert>
        )}
        {selectedCondominio && selectedOrcamentos.length > 0 && totalCoberturas === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>Orçamentos sem coberturas preenchidas. A análise será feita apenas com as características do condomínio.</Alert>
        )}
        {selectedCondominio && selectedOrcamentos.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }} icon={<InfoOutlinedIcon />}>
            <strong>Análise geral:</strong> Sem orçamento selecionado, a IA analisará apenas as características do condomínio.
          </Alert>
        )}

        {/* Condominio Preview */}
        {selectedCondominio && (
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e2e8f0' }}>
            {loadingDetails ? (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton variant="rounded" width={200} height={80} />
                <Skeleton variant="rounded" width={200} height={80} />
                <Skeleton variant="rounded" width={200} height={80} />
              </Box>
            ) : condominioDetails && (
              <Grid container spacing={2}>
                {[
                  { label: 'Tipo', value: condominioDetails.caracteristicas?.tipoConstrucao || 'Não informado' },
                  { label: 'Unidades', value: condominioDetails.caracteristicas?.numeroUnidades || '-' },
                  { label: 'Blocos', value: condominioDetails.caracteristicas?.numeroBlocos || '-' },
                  { label: 'Andares', value: condominioDetails.caracteristicas?.numeroAndares || '-' },
                  { label: 'Elevadores', value: condominioDetails.caracteristicas?.numeroElevadores || '-' },
                  { label: 'Área', value: condominioDetails.caracteristicas?.areaConstruida ? `${condominioDetails.caracteristicas.areaConstruida} m²` : '-' },
                  { label: 'Ano Construção', value: condominioDetails.caracteristicas?.anoConstrucao || '-' },
                ].map((item, i) => (
                  <Grid item xs={6} md={i === 0 ? 3 : 2} key={item.label}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                      <Typography variant="body1" fontWeight="600">{item.value}</Typography>
                    </Box>
                  </Grid>
                ))}
                <Grid item xs={12} md={3}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Estrutura</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      {estruturaList.filter(a => a.active).map((a, idx) => (
                        <Chip key={idx} label={a.label} size="small" sx={{ fontSize: 10 }} />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
      </Paper>

      {/* ─── Loading Skeleton ───────────────────────────────────── */}
      {loadingDiagnostico && (
        <Box>
          <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Skeleton variant="circular" width={160} height={160} animation="wave" />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" height={40} animation="wave" />
                <Skeleton variant="text" width="70%" height={24} animation="wave" sx={{ mt: 1 }} />
                <Skeleton variant="rounded" width="100%" height={12} animation="wave" sx={{ mt: 2 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={100} height={100} animation="wave" />)}
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* ═══ Results ═══════════════════════════════════════════════ */}
      {diagnostico && !loadingDiagnostico && (
        <>
          {/* ─── Sticky Mini-Summary (14) ─────────────────────── */}
          <Box sx={{
            position: 'sticky', top: 0, zIndex: 20,
            opacity: showStickyBar ? 1 : 0,
            transform: showStickyBar ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'all 0.3s ease',
            pointerEvents: showStickyBar ? 'auto' : 'none',
            mb: showStickyBar ? 1 : 0,
          }}>
            <Paper sx={{
              px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 2,
              borderRadius: 2, bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
            }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: getStatusGradient(diagnostico.status), color: 'white', fontWeight: 800, fontSize: '0.85rem',
              }}>
                {Math.round(diagnostico.score)}
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }} noWrap>
                {diagnostico.condominio_nome}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label={diagnostico.coberturas_adequadas.length} size="small" sx={{ bgcolor: '#f0fdf4', color: '#166534', fontWeight: 700 }} />
                <Chip icon={<WarningIcon sx={{ fontSize: 14 }} />} label={diagnostico.coberturas_insuficientes.length} size="small" sx={{ bgcolor: '#fffbeb', color: '#92400e', fontWeight: 700 }} />
                <Chip icon={<ErrorIcon sx={{ fontSize: 14 }} />} label={diagnostico.coberturas_ausentes.length} size="small" sx={{ bgcolor: '#fef2f2', color: '#991b1b', fontWeight: 700 }} />
              </Box>
              <Button size="small" variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleExportPDF}
                disabled={loadingReport} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                PDF
              </Button>
            </Paper>
          </Box>

          {/* ─── Score Section (1) ────────────────────────────── */}
          <Paper ref={scoreRef} sx={{ p: 0, mb: 3, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 4, background: getStatusGradient(diagnostico.status), color: 'white', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant="determinate" value={100} size={160} thickness={4} sx={{ color: 'rgba(255,255,255,0.2)' }} />
                <CircularProgress variant="determinate" value={animatedScore} size={160} thickness={4}
                  sx={{ color: 'white', position: 'absolute', left: 0, transition: 'none' }} />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <Typography variant="h2" fontWeight="bold">{animatedScore}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>pontos</Typography>
                </Box>
              </Box>

              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h4" fontWeight="bold">{getStatusLabel(diagnostico.status)}</Typography>
                  {scoreDiff !== null && (
                    <Chip
                      icon={scoreDiff > 0 ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />}
                      label={`${scoreDiff > 0 ? '+' : ''}${scoreDiff}`}
                      size="small"
                      sx={{
                        bgcolor: scoreDiff > 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,0,0,0.25)',
                        color: 'white', fontWeight: 700,
                      }}
                    />
                  )}
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                  {diagnostico.status === 'adequado' ? 'O condomínio possui uma boa cobertura de seguro. Continue monitorando.'
                    : diagnostico.status === 'atencao' ? 'Algumas coberturas precisam de atenção. Revise as recomendações.'
                    : 'Há lacunas importantes na cobertura. Ação imediata recomendada.'}
                </Typography>
                {/* Horizontal bar (1) */}
                <Box sx={{ width: '100%', maxWidth: 400 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>0</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>100</Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                    <Box sx={{
                      width: `${animatedScore}%`, height: '100%', borderRadius: 4,
                      bgcolor: 'white', transition: 'width 0.5s ease',
                    }} />
                  </Box>
                </Box>
                {diagnostico.condominio_nome && (
                  <Chip icon={<ApartmentIcon />} label={diagnostico.condominio_nome} sx={{ mt: 1.5, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {[
                  { icon: <CheckCircleIcon sx={{ fontSize: 28, mb: 0.5 }} />, count: diagnostico.coberturas_adequadas.length, label: 'Adequadas' },
                  { icon: <WarningIcon sx={{ fontSize: 28, mb: 0.5 }} />, count: diagnostico.coberturas_insuficientes.length, label: 'Insuficientes' },
                  { icon: <ErrorIcon sx={{ fontSize: 28, mb: 0.5 }} />, count: diagnostico.coberturas_ausentes.length, label: 'Ausentes' },
                ].map((s) => (
                  <Box key={s.label} sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, minWidth: 100 }}>
                    {s.icon}
                    <Typography variant="h4" fontWeight="bold">{s.count}</Typography>
                    <Typography variant="caption">{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* ─── Coberturas Section (2, 7, 12) ─────────────── */}
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '2px solid #22c55e', borderRadius: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CheckCircleIcon sx={{ color: '#22c55e' }} />
                      <Typography variant="subtitle1" fontWeight="bold" color="#16a34a">Coberturas Adequadas</Typography>
                      <Chip label={diagnostico.coberturas_adequadas.length} size="small" sx={{ ml: 'auto', bgcolor: '#dcfce7', fontWeight: 700, color: '#166534' }} />
                    </Box>
                    {renderCoberturaList(diagnostico.coberturas_adequadas, 'adequada', showAllAdequadas, setShowAllAdequadas)}
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '2px solid #f59e0b', borderRadius: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <WarningIcon sx={{ color: '#f59e0b' }} />
                      <Typography variant="subtitle1" fontWeight="bold" color="#d97706">Coberturas Insuficientes</Typography>
                      <Chip label={diagnostico.coberturas_insuficientes.length} size="small" sx={{ ml: 'auto', bgcolor: '#fef3c7', fontWeight: 700, color: '#92400e' }} />
                    </Box>
                    {renderCoberturaList(diagnostico.coberturas_insuficientes, 'insuficiente', showAllInsuficientes, setShowAllInsuficientes)}
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '2px solid #ef4444', borderRadius: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ErrorIcon sx={{ color: '#ef4444' }} />
                      <Typography variant="subtitle1" fontWeight="bold" color="#dc2626">Coberturas Ausentes</Typography>
                      <Chip label={diagnostico.coberturas_ausentes.length} size="small" sx={{ ml: 'auto', bgcolor: '#fee2e2', fontWeight: 700, color: '#991b1b' }} />
                    </Box>
                    {renderCoberturaList(diagnostico.coberturas_ausentes, 'ausente', showAllAusentes, setShowAllAusentes)}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* ─── Recomendacoes (3) ────────────────────────────── */}
          {diagnostico.recomendacoes.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TipsAndUpdatesIcon sx={{ color: '#6366f1', fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold">Recomendações</Typography>
                <Chip label={`${diagnostico.recomendacoes.length} itens`} size="small" sx={{ ml: 1 }} />
              </Box>
              <Grid container spacing={2}>
                {diagnostico.recomendacoes.sort((a, b) => b.prioridade - a.prioridade).map((rec, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Card variant="outlined" sx={{
                      height: '100%',
                      borderLeft: `8px solid ${rec.tipo === 'cuidado' ? '#ef4444' : rec.tipo === 'alerta' ? '#f59e0b' : '#6366f1'}`,
                      opacity: checkedRecs[idx] ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <MuiCheckbox size="small" checked={!!checkedRecs[idx]} onChange={() => handleToggleRec(idx)}
                              sx={{ p: 0, color: '#94a3b8' }} />
                            <Chip label={rec.tipo.toUpperCase()} size="small"
                              color={rec.tipo === 'cuidado' ? 'error' : rec.tipo === 'alerta' ? 'warning' : 'primary'}
                              sx={{ fontWeight: 600 }} />
                            <Chip label={rec.categoria} size="small" variant="outlined" />
                          </Box>
                          <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, borderRadius: 1,
                            bgcolor: rec.prioridade >= 4 ? '#fef2f2' : rec.prioridade >= 3 ? '#fffbeb' : '#f0f9ff',
                          }}>
                            {rec.prioridade >= 4 ? <ArrowUpwardIcon sx={{ fontSize: 16, color: '#ef4444' }} /> : <InfoOutlinedIcon sx={{ fontSize: 16, color: rec.prioridade >= 3 ? '#f59e0b' : '#3b82f6' }} />}
                            <Typography variant="caption" fontWeight="600" color={rec.prioridade >= 4 ? '#991b1b' : rec.prioridade >= 3 ? '#92400e' : '#1e40af'}>P{rec.prioridade}</Typography>
                          </Box>
                        </Box>
                        <Typography variant="body1" sx={{ mb: 1.5, textDecoration: checkedRecs[idx] ? 'line-through' : 'none' }}>{rec.descricao}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">Impacto: {rec.impacto}</Typography>
                          </Box>
                          <Button size="small" startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                            onClick={() => router.push(`/dashboard/assistente?context=diagnostico&q=${encodeURIComponent(rec.descricao)}`)}
                            sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
                            Perguntar IA
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* ─── Plano de Acao (9) ────────────────────────────── */}
          {diagnostico.recomendacoes.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PlaylistAddCheckIcon sx={{ color: '#6366f1', fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold">Plano de Ação</Typography>
                <Chip label={`${checkedCount}/${totalRecs}`} size="small" sx={{ ml: 1, fontWeight: 700 }} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Progresso</Typography>
                  <Typography variant="caption" fontWeight={700}>{Math.round(checkProgress)}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={checkProgress}
                  sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: checkProgress === 100 ? '#22c55e' : '#6366f1', borderRadius: 4 } }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {diagnostico.recomendacoes.sort((a, b) => b.prioridade - a.prioridade).map((rec, idx) => (
                  <Box key={idx} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 1,
                    bgcolor: checkedRecs[idx] ? '#f0fdf4' : '#f8fafc',
                    border: `1px solid ${checkedRecs[idx] ? '#bbf7d0' : '#e2e8f0'}`,
                    cursor: 'pointer', '&:hover': { bgcolor: checkedRecs[idx] ? '#dcfce7' : '#f1f5f9' },
                  }} onClick={() => handleToggleRec(idx)}>
                    <MuiCheckbox size="small" checked={!!checkedRecs[idx]}
                      sx={{ p: 0, color: checkedRecs[idx] ? '#22c55e' : '#94a3b8' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}
                        sx={{ textDecoration: checkedRecs[idx] ? 'line-through' : 'none', color: checkedRecs[idx] ? '#94a3b8' : 'inherit' }}>
                        {rec.descricao}
                      </Typography>
                    </Box>
                    <Chip label={rec.tipo.toUpperCase()} size="small" sx={{
                      height: 20, fontSize: '0.6rem', fontWeight: 700,
                      bgcolor: rec.tipo === 'cuidado' ? '#fef2f2' : rec.tipo === 'alerta' ? '#fffbeb' : '#eef2ff',
                      color: rec.tipo === 'cuidado' ? '#991b1b' : rec.tipo === 'alerta' ? '#92400e' : '#4338ca',
                    }} />
                    <Chip label={`P${rec.prioridade}`} size="small" sx={{
                      height: 20, fontSize: '0.6rem', fontWeight: 700,
                      bgcolor: rec.prioridade >= 4 ? '#fef2f2' : rec.prioridade >= 3 ? '#fffbeb' : '#f0f9ff',
                      color: rec.prioridade >= 4 ? '#991b1b' : rec.prioridade >= 3 ? '#92400e' : '#1e40af',
                    }} />
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* ─── Riscos (4) ───────────────────────────────────── */}
          {diagnostico.riscos_identificados.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <SecurityIcon sx={{ color: '#ef4444', fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold">Riscos Identificados</Typography>
                <Chip label={`${diagnostico.riscos_identificados.length} riscos`} size="small" color="error" sx={{ ml: 1 }} />
              </Box>
              <Grid container spacing={2}>
                {diagnostico.riscos_identificados.map((risco, idx) => {
                  const colors = getSeveridadeBgColor(risco.severidade)
                  const isAlta = risco.severidade === 'alta'
                  return (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Card sx={{
                        height: '100%',
                        border: `${isAlta ? 3 : risco.severidade === 'media' ? 2 : 1}px solid ${colors.border}`,
                        bgcolor: colors.bg,
                        borderRadius: 3,
                        ...(isAlta && {
                          boxShadow: `0 0 12px ${colors.border}60`,
                          animation: 'riscoAlta 3s infinite',
                          '@keyframes riscoAlta': {
                            '0%, 100%': { boxShadow: `0 0 8px ${colors.border}40` },
                            '50%': { boxShadow: `0 0 16px ${colors.border}80` },
                          },
                        }),
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Box sx={{ color: colors.icon }}>
                              {getRiscoIcon(risco.risco, isAlta ? 40 : 32)}
                            </Box>
                            <Chip label={risco.severidade.toUpperCase()} size="small"
                              color={getSeveridadeColor(risco.severidade) as 'error' | 'warning' | 'info'}
                              sx={{ fontWeight: 700, fontSize: isAlta ? '0.8rem' : '0.7rem' }} />
                          </Box>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: colors.text, mb: 1 }}>
                            {risco.risco}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5, mb: 1.5 }}>
                            {risco.mitigacao}
                          </Typography>
                          <Button size="small" startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                            onClick={() => router.push(`/dashboard/assistente?context=diagnostico&q=${encodeURIComponent(`Como mitigar o risco: ${risco.risco}`)}`)}
                            sx={{ textTransform: 'none', fontSize: '0.7rem', color: colors.text }}>
                            Como mitigar?
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </Paper>
          )}

          {/* ─── Estimativa de Custo (10) ─────────────────────── */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AttachMoneyIcon sx={{ color: '#22c55e', fontSize: 28 }} />
              <Typography variant="h5" fontWeight="bold">Estimativa de Custo</Typography>
            </Box>
            {costEstimate ? (
              <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{costEstimate}</Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Solicite uma estimativa de custo para adequar todas as coberturas ausentes e insuficientes.
                </Typography>
                <Button variant="outlined" startIcon={estimatingCost ? <CircularProgress size={16} /> : <AttachMoneyIcon />}
                  onClick={handleEstimateCost} disabled={estimatingCost}
                  sx={{ textTransform: 'none', borderColor: '#22c55e', color: '#22c55e', '&:hover': { borderColor: '#16a34a', bgcolor: '#f0fdf4' } }}>
                  {estimatingCost ? 'Estimando...' : 'Estimar Custos com IA'}
                </Button>
              </Box>
            )}
          </Paper>

          {/* ─── Sticky Action Bar (5, 13) ────────────────────── */}
          <Paper sx={{
            position: 'sticky', bottom: 16, zIndex: 15,
            p: 2, display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center',
            borderRadius: 3, boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0', bgcolor: 'white', flexWrap: 'wrap',
          }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleAnalyze}
              sx={{ borderColor: '#6366f1', color: '#6366f1', textTransform: 'none' }}>
              Refazer Analise
            </Button>
            <Button variant="outlined"
              startIcon={loadingReport ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
              onClick={handleExportPDF} disabled={loadingReport}
              sx={{ borderColor: '#3b82f6', color: '#3b82f6', textTransform: 'none', '&:hover': { borderColor: '#2563eb', bgcolor: '#eff6ff' } }}>
              {loadingReport ? 'Gerando...' : 'Exportar PDF'}
            </Button>
            <Tooltip title="Copiar resumo">
              <IconButton onClick={handleCopyResumo} sx={{ border: '1px solid #e2e8f0' }}>
                <ContentCopyIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            {typeof window !== 'undefined' && 'share' in navigator && (
              <Tooltip title="Compartilhar">
                <IconButton onClick={handleShare} sx={{ border: '1px solid #e2e8f0' }}>
                  <ShareIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}
            <Button variant="contained" startIcon={<AutoAwesomeIcon />}
              onClick={() => router.push('/dashboard/assistente?context=diagnostico')}
              sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none' }}>
              Tirar Duvidas com IA
            </Button>
          </Paper>
        </>
      )}

      {/* ─── Empty State (6) ──────────────────────────────────── */}
      {!diagnostico && !loadingDiagnostico && (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <ShieldIcon sx={{ fontSize: 40, color: '#6366f1' }} />
          </Box>
          {selectedCondominio ? (
            <>
              <Typography variant="h5" fontWeight="600" gutterBottom>Pronto para analisar</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                Selecione orçamentos para uma análise detalhada ou clique em Analisar para uma avaliação geral do condomínio.
              </Typography>
              <Button variant="contained" startIcon={<AnalyticsIcon />} onClick={handleAnalyze}
                disabled={loadingDiagnostico}
                sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                Analisar Agora
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h5" fontWeight="600" gutterBottom>Selecione um condomínio para começar</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
                O diagnóstico inteligente analisa as características do seu condomínio e suas coberturas de seguro, identificando riscos e oportunidades de melhoria.
              </Typography>
            </>
          )}
        </Paper>
      )}

      {/* Snackbar */}
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)}
        message={snackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  )
}
