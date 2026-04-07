'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  TextField,
  InputAdornment,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import StarIcon from '@mui/icons-material/Star'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import SecurityIcon from '@mui/icons-material/Security'
import BalanceIcon from '@mui/icons-material/Balance'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ApartmentIcon from '@mui/icons-material/Apartment'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DescriptionIcon from '@mui/icons-material/Description'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LooksOneIcon from '@mui/icons-material/LooksOne'
import LooksTwoIcon from '@mui/icons-material/LooksTwo'
import Looks3Icon from '@mui/icons-material/Looks3'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import SearchIcon from '@mui/icons-material/Search'
import SaveIcon from '@mui/icons-material/Save'
import HistoryIcon from '@mui/icons-material/History'
import DeleteIcon from '@mui/icons-material/Delete'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { useRouter } from 'next/navigation'
import { condominioService } from '@/services/condominioService'
import { iaService } from '@/services/iaService'
import { documentoService } from '@/services/documentoService'
import {
  CondominioListResponse,
  DocumentoListResponse,
  ComparacaoResultadoDTO,
  OrcamentoComparacaoDTO,
  CoberturaDTO,
} from '@/types'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

const STEPS = [
  'Selecione o Condomínio',
  'Escolha os Orçamentos',
  'Compare e Analise',
]

const RADAR_COLORS = ['#6366f1', '#f43f5e', '#06b6d4', '#f59e0b', '#10b981']

// Coverage categories for radar chart
const COVERAGE_CATEGORIES: Record<string, string[]> = {
  'Incêndio/Básicas': ['Incêndio, Raio e Explosão', 'Queda de Aeronaves', 'Fumaça'],
  'Fenômenos Naturais': ['Vendaval, Furacão, Ciclone, Tornado e Granizo', 'Alagamento e Inundação', 'Desmoronamento'],
  'Responsabilidade Civil': ['Responsabilidade Civil do Condomínio', 'Responsabilidade Civil do Síndico', 'Responsabilidade Civil Guarda de Veículos'],
  'Danos Materiais': ['Danos Elétricos', 'Quebra de Vidros', 'Equipamentos Eletrônicos', 'Impacto de Veículos Terrestres'],
  'Patrimonial': ['Roubo de Bens do Condomínio', 'Tumultos e Greves'],
  'Financeiro': ['Despesas Fixas', 'Perda de Aluguel'],
}

interface SavedComparison {
  id: string
  name: string
  condominioNome: string
  condominioId: string
  orcamentoIds: string[]
  seguradoras: string[]
  date: string
}

export default function CompararPage() {
  const router = useRouter()
  const [condominios, setCondominios] = useState<CondominioListResponse[]>([])
  const [selectedCondominio, setSelectedCondominio] = useState<string>('')
  const [orcamentos, setOrcamentos] = useState<DocumentoListResponse[]>([])
  const [selectedOrcamentos, setSelectedOrcamentos] = useState<string[]>([])
  const [comparacao, setComparacao] = useState<ComparacaoResultadoDTO | null>(null)
  const [loadingCondominios, setLoadingCondominios] = useState(true)
  const [loadingOrcamentos, setLoadingOrcamentos] = useState(false)
  const [loadingComparacao, setLoadingComparacao] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [iaAnalise, setIaAnalise] = useState<string | null>(null)
  const [iaLoading, setIaLoading] = useState(false)

  // New state for improvements
  const [matrixSearch, setMatrixSearch] = useState('')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const activeStep = comparacao ? 2 : selectedCondominio ? 1 : 0

  // Load saved comparisons from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('saved_comparisons')
    if (saved) {
      try { setSavedComparisons(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    const loadCondominios = async () => {
      try {
        const response = await condominioService.list({}, { size: 100 })
        setCondominios(response.content)
      } catch (err) {
        console.error('Error loading condominios:', err)
        setError('Erro ao carregar condomínios')
      } finally {
        setLoadingCondominios(false)
      }
    }
    loadCondominios()
  }, [])

  useEffect(() => {
    if (!selectedCondominio) {
      setOrcamentos([])
      setSelectedOrcamentos([])
      setComparacao(null)
      return
    }

    const loadOrcamentos = async () => {
      try {
        setLoadingOrcamentos(true)
        setError(null)
        const response = await documentoService.listByCondominioAndTipo(
          selectedCondominio,
          'ORCAMENTO'
        )
        setOrcamentos(response)
        setSelectedOrcamentos([])
        setComparacao(null)
      } catch (err) {
        console.error('Error loading orcamentos:', err)
        setError('Erro ao carregar orçamentos')
      } finally {
        setLoadingOrcamentos(false)
      }
    }
    loadOrcamentos()
  }, [selectedCondominio])

  const handleToggleOrcamento = (id: string) => {
    setSelectedOrcamentos((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id)
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  const handleComparar = async () => {
    if (selectedOrcamentos.length < 2) {
      setError('Selecione pelo menos 2 orçamentos para comparar')
      return
    }
    try {
      setLoadingComparacao(true)
      setError(null)
      setIaAnalise(null)
      const result = await documentoService.compararOrcamentos(selectedCondominio, selectedOrcamentos)
      setComparacao(result)
    } catch (err: unknown) {
      console.error('Error comparing:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao comparar orçamentos'
      if (errorMessage.includes('não foi preenchido')) {
        setError('Um ou mais orçamentos não tem dados preenchidos. Preencha os dados antes de comparar.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoadingComparacao(false)
    }
  }

  const handleGenerarAnaliseIA = async () => {
    if (!comparacao) return
    try {
      setIaLoading(true)
      const dados = {
        orcamentos: comparacao.orcamentos.map((orc) => ({
          seguradora: orc.seguradoraNome,
          valorPremio: orc.valorPremio,
          coberturas: orc.coberturas.map((c) => ({
            nome: c.nome,
            valorLimite: c.valorLimite,
            franquia: c.franquia,
            incluido: c.incluido,
          })),
          formaPagamento: orc.formaPagamento,
        })),
      }
      const result = await iaService.analyzeComparacao(dados)
      setIaAnalise(result.analise)
    } catch (err) {
      console.error('Error generating IA analysis:', err)
      setError('Erro ao gerar análise da IA')
    } finally {
      setIaLoading(false)
    }
  }

  // === PDF Export ===
  const handleExportPDF = async () => {
    if (!comparacao) return
    setPdfLoading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF('landscape', 'mm', 'a4')
      const condNome = selectedCondominioData?.nome || 'Condominio'

      // Title
      doc.setFontSize(18)
      doc.setTextColor(99, 102, 241)
      doc.text('CondoCompare - Comparação de Orçamentos', 14, 20)
      doc.setFontSize(12)
      doc.setTextColor(100)
      doc.text(`Condomínio: ${condNome}`, 14, 28)
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34)

      // Summary table
      doc.setFontSize(14)
      doc.setTextColor(0)
      doc.text('Resumo dos Orçamentos', 14, 44)

      const summaryHeaders = ['Métrica', ...comparacao.orcamentos.map(o => o.seguradoraNome)]
      const allCob = getAllCoberturas(comparacao.orcamentos)
      const summaryBody = [
        ['Prêmio Anual', ...comparacao.orcamentos.map(o => formatCurrency(o.valorPremio))],
        ['Vigência', ...comparacao.orcamentos.map(o => `${o.vigenciaDias} dias`)],
        ['Pagamento', ...comparacao.orcamentos.map(o => o.formaPagamento || '-')],
        ['Coberturas', ...comparacao.orcamentos.map(o => `${o.coberturas.filter(c => c.incluido).length}/${allCob.length}`)],
        ['Total Franquias', ...comparacao.orcamentos.map(o => {
          const total = o.coberturas.filter(c => c.incluido && c.franquia).reduce((sum, c) => sum + (c.franquia || 0), 0)
          return formatCurrency(total)
        })],
      ]

      autoTable(doc, {
        head: [summaryHeaders],
        body: summaryBody,
        startY: 48,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      })

      // Coverage matrix
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matrixY = (doc as any).lastAutoTable?.finalY || 100
      doc.setFontSize(14)
      doc.text('Matriz de Coberturas', 14, matrixY + 10)

      const matrixHeaders = ['Cobertura', ...comparacao.orcamentos.map(o => o.seguradoraNome)]
      const matrixBody = allCob.map(cobNome => {
        return [cobNome, ...comparacao.orcamentos.map(orc => {
          const c = orc.coberturas.find(co => co.nome === cobNome)
          if (!c?.incluido) return 'Ausente'
          let text = 'Incluído'
          if (c.valorLimite) text = formatCurrency(c.valorLimite)
          if (c.franquia) text += ` (Fr: ${formatCurrency(c.franquia)})`
          return text
        })]
      })

      autoTable(doc, {
        head: [matrixHeaders],
        body: matrixBody,
        startY: matrixY + 14,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      })

      // Recommendation
      if (comparacao.resumo.recomendacoes.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recY = (doc as any).lastAutoTable?.finalY || 180
        if (recY > 170) doc.addPage()
        const startY = recY > 170 ? 20 : recY + 10
        doc.setFontSize(14)
        doc.text('Recomendações', 14, startY)
        let yPos = startY + 8
        comparacao.resumo.recomendacoes.forEach((rec) => {
          const label = rec.tipo === 'MENOR_PRECO' ? 'Menor Preço' : rec.tipo === 'MAIOR_COBERTURA' ? 'Maior Cobertura' : 'Melhor Custo-Benefício'
          doc.setFontSize(10)
          doc.setTextColor(0)
          doc.text(`${label}: ${rec.seguradora}`, 14, yPos)
          doc.setFontSize(8)
          doc.setTextColor(100)
          doc.text(rec.justificativa, 14, yPos + 5, { maxWidth: 260 })
          yPos += 14
        })
      }

      // IA analysis if available
      if (iaAnalise) {
        doc.addPage()
        doc.setFontSize(14)
        doc.setTextColor(0)
        doc.text('Análise Inteligente (IA)', 14, 20)
        doc.setFontSize(9)
        doc.setTextColor(60)
        const lines = doc.splitTextToSize(iaAnalise, 260)
        doc.text(lines, 14, 28)
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`CondoCompare - Gerado em ${new Date().toLocaleString('pt-BR')} - Página ${i}/${pageCount}`, 14, doc.internal.pageSize.height - 10)
      }

      doc.save(`comparacao-${condNome.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`)
      setSnackbar({ open: true, message: 'PDF exportado com sucesso!', severity: 'success' })
    } catch (err) {
      console.error('Error exporting PDF:', err)
      setSnackbar({ open: true, message: 'Erro ao exportar PDF', severity: 'error' })
    } finally {
      setPdfLoading(false)
    }
  }

  // === Save Comparison ===
  const handleSaveComparison = () => {
    if (!comparacao || !saveName.trim()) return
    const newSave: SavedComparison = {
      id: crypto.randomUUID(),
      name: saveName.trim(),
      condominioNome: selectedCondominioData?.nome || '',
      condominioId: selectedCondominio,
      orcamentoIds: selectedOrcamentos,
      seguradoras: comparacao.orcamentos.map(o => o.seguradoraNome),
      date: new Date().toISOString(),
    }
    const updated = [newSave, ...savedComparisons]
    setSavedComparisons(updated)
    localStorage.setItem('saved_comparisons', JSON.stringify(updated))
    setSaveDialogOpen(false)
    setSaveName('')
    setSnackbar({ open: true, message: 'Comparação salva com sucesso!', severity: 'success' })
  }

  const handleLoadComparison = (saved: SavedComparison) => {
    setHistoryDialogOpen(false)
    setSelectedCondominio(saved.condominioId)
    // Wait for orcamentos to load, then select and compare
    setTimeout(() => {
      setSelectedOrcamentos(saved.orcamentoIds)
    }, 1000)
  }

  const handleDeleteSaved = (id: string) => {
    const updated = savedComparisons.filter(s => s.id !== id)
    setSavedComparisons(updated)
    localStorage.setItem('saved_comparisons', JSON.stringify(updated))
  }

  const getRecomendaçãoIcon = (tipo: string) => {
    switch (tipo) {
      case 'MENOR_PRECO': return <TrendingDownIcon sx={{ color: '#4caf50' }} />
      case 'MAIOR_COBERTURA': return <SecurityIcon sx={{ color: '#2196f3' }} />
      case 'MELHOR_CUSTO_BENEFICIO': return <BalanceIcon sx={{ color: '#ff9800' }} />
      default: return <StarIcon sx={{ color: '#9c27b0' }} />
    }
  }

  const getRecomendaçãoColor = (tipo: string) => {
    switch (tipo) {
      case 'MENOR_PRECO': return { bg: '#dcfce7', border: '#bbf7d0', text: '#166534' }
      case 'MAIOR_COBERTURA': return { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af' }
      case 'MELHOR_CUSTO_BENEFICIO': return { bg: '#fef3c7', border: '#fde68a', text: '#92400e' }
      default: return { bg: '#f3e5f5', border: '#e1bee7', text: '#6a1b9a' }
    }
  }

  const getRecomendaçãoLabel = (tipo: string) => {
    switch (tipo) {
      case 'MENOR_PRECO': return 'Menor Preço'
      case 'MAIOR_COBERTURA': return 'Maior Cobertura'
      case 'MELHOR_CUSTO_BENEFICIO': return 'Melhor Custo-Benefício'
      default: return tipo
    }
  }

  const getAllCoberturas = (orcs: OrcamentoComparacaoDTO[]): string[] => {
    const all = new Set<string>()
    orcs.forEach((orc) => orc.coberturas.forEach((c) => all.add(c.nome)))
    return Array.from(all).sort()
  }

  const getCoberturaValue = (
    orcamento: OrcamentoComparacaoDTO,
    coberturaNome: string
  ): CoberturaDTO | undefined => {
    return orcamento.coberturas.find((c) => c.nome === coberturaNome)
  }

  const selectedCondominioData = condominios.find((c) => c.id === selectedCondominio)

  // Radar chart data
  const radarData = useMemo(() => {
    if (!comparacao) return []
    return Object.entries(COVERAGE_CATEGORIES).map(([category, cobNames]) => {
      const entry: Record<string, string | number> = { category }
      comparacao.orcamentos.forEach((orc) => {
        const total = cobNames.length
        const covered = cobNames.filter(name =>
          orc.coberturas.some(c => c.nome === name && c.incluido)
        ).length
        entry[orc.seguradoraNome] = total > 0 ? Math.round((covered / total) * 100) : 0
      })
      return entry
    })
  }, [comparacao])

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Comparar Orçamentos</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Compare até 5 orçamentos de seguro lado a lado
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {savedComparisons.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setHistoryDialogOpen(true)}
              size="small"
            >
              Histórico ({savedComparisons.length})
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<HelpOutlineIcon />}
            onClick={() => router.push('/dashboard/assistente?context=comparacao&from=comparar')}
            sx={{ borderColor: '#6366f1', color: '#6366f1' }}
          >
            Ajuda da IA
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* Stepper */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label, index) => (
            <Step key={label} completed={index < activeStep}>
              <StepLabel
                StepIconProps={{
                  sx: { '&.Mui-active': { color: '#3b82f6' }, '&.Mui-completed': { color: '#22c55e' } },
                }}
              >
                <Typography variant="body2" fontWeight={index === activeStep ? 600 : 400} color={index <= activeStep ? 'text.primary' : 'text.disabled'}>
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step 1: Select Condominio */}
      <Paper sx={{ p: 3, mb: 3, border: activeStep === 0 ? '2px solid #3b82f6' : '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: selectedCondominio ? '#22c55e' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {selectedCondominio ? <CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} /> : <LooksOneIcon sx={{ color: 'white', fontSize: 20 }} />}
          </Box>
          <Typography variant="h6" fontWeight="600">Selecione o Condomínio</Typography>
          {selectedCondominioData && (
            <Chip
              label={`${selectedCondominioData.nome} - ${selectedCondominioData.cidade}/${selectedCondominioData.estado}`}
              color="primary"
              variant="outlined"
              size="small"
              onDelete={() => setSelectedCondominio('')}
            />
          )}
        </Box>

        {loadingCondominios ? (
          <Box sx={{ py: 1 }}>
            <Skeleton variant="rounded" height={40} animation="wave" />
          </Box>
        ) : condominios.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <ApartmentIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>Nenhum condomínio cadastrado</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Para comparar orcamentos, primeiro cadastre um condomínio e faça upload dos PDFs de orçamento.
            </Typography>
            <Button variant="contained" startIcon={<ApartmentIcon />} onClick={() => router.push('/dashboard/condominios/novo')} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
              Cadastrar Condomínio
            </Button>
          </Box>
        ) : (
          <FormControl fullWidth size="small">
            <InputLabel>Selecione o Condomínio</InputLabel>
            <Select value={selectedCondominio} label="Selecione o Condomínio" onChange={(e) => setSelectedCondominio(e.target.value)}>
              {condominios.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ApartmentIcon fontSize="small" sx={{ color: '#64748b' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{c.nome}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.cidade}/{c.estado} {c.numeroUnidades ? `- ${c.numeroUnidades} unidades` : ''}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Paper>

      {/* Step 2: Select Orcamentos */}
      {selectedCondominio && (
        <Paper sx={{ p: 3, mb: 3, border: activeStep === 1 ? '2px solid #3b82f6' : '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: comparacao ? '#22c55e' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {comparacao ? <CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} /> : <LooksTwoIcon sx={{ color: 'white', fontSize: 20 }} />}
              </Box>
              <Typography variant="h6" fontWeight="600">Orçamentos Disponíveis</Typography>
              {orcamentos.length > 0 && (
                <Chip label={`${orcamentos.length} encontrado${orcamentos.length > 1 ? 's' : ''}`} size="small" variant="outlined" />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {selectedOrcamentos.length > 0 && (
                <Chip label={`${selectedOrcamentos.length} selecionado${selectedOrcamentos.length > 1 ? 's' : ''}`} color="primary" size="small" />
              )}
              <Button
                variant="contained"
                startIcon={loadingComparacao ? <CircularProgress size={16} color="inherit" /> : <CompareArrowsIcon />}
                onClick={handleComparar}
                disabled={selectedOrcamentos.length < 2 || loadingComparacao}
                sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
              >
                {loadingComparacao ? 'Comparando...' : `Comparar (${selectedOrcamentos.length}/5)`}
              </Button>
            </Box>
          </Box>

          {loadingOrcamentos ? (
            <Box sx={{ py: 3 }}>
              <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
              <Typography variant="body2" color="text.secondary" textAlign="center">Carregando orçamentos...</Typography>
            </Box>
          ) : orcamentos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, px: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
              <DescriptionIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>Nenhum orçamento encontrado</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 480, mx: 'auto' }}>
                Faça upload dos PDFs de orçamento na página de Documentos para habilitar a comparação.
              </Typography>
              <Button variant="contained" startIcon={<UploadFileIcon />} onClick={() => router.push('/dashboard/documentos')} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
                Ir para Documentos
              </Button>
            </Box>
          ) : (
            <>
              {selectedOrcamentos.length < 2 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Selecione entre <strong>2 e 5 orçamentos</strong> com dados preenchidos para comparar.
                </Alert>
              )}
              <Grid container spacing={2}>
                {orcamentos.map((orc) => {
                  const isSelected = selectedOrcamentos.includes(orc.id)
                  const isPreenchido = orc.status === 'CONCLUIDO'
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={orc.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: isPreenchido ? 'pointer' : 'default',
                          border: isSelected ? '2px solid #3b82f6' : isPreenchido ? '1px solid #e2e8f0' : '1px dashed #fbbf24',
                          bgcolor: isSelected ? '#eff6ff' : isPreenchido ? 'white' : '#fffbeb',
                          opacity: !isPreenchido ? 0.85 : 1,
                          transition: 'all 0.2s ease',
                          '&:hover': isPreenchido ? { borderColor: '#3b82f6', boxShadow: 2 } : {},
                        }}
                        onClick={() => isPreenchido && handleToggleOrcamento(orc.id)}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {orc.nome}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {orc.seguradoraNome || 'Seguradora não informada'}
                              </Typography>
                            </Box>
                            {isPreenchido && (
                              <Checkbox
                                checked={isSelected}
                                disabled={!isSelected && selectedOrcamentos.length >= 5}
                                size="small"
                                sx={{ p: 0.5, color: '#94a3b8', '&.Mui-checked': { color: '#3b82f6' } }}
                              />
                            )}
                          </Box>
                          <Chip
                            size="small"
                            label={isPreenchido ? 'Pronto' : 'Pendente'}
                            color={isPreenchido ? 'success' : 'warning'}
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.7rem' }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </>
          )}
        </Paper>
      )}

      {/* Empty state */}
      {!selectedCondominio && condominios.length > 0 && !loadingCondominios && (
        <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <CompareArrowsIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h5" fontWeight="600" color="text.secondary" gutterBottom>Como funciona a comparação?</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 3, flexWrap: 'wrap' }}>
            {[
              { icon: <LooksOneIcon sx={{ fontSize: 28, color: '#3b82f6' }} />, title: 'Selecione o Condomínio', desc: 'Escolha o condomínio que deseja comparar' },
              { icon: <LooksTwoIcon sx={{ fontSize: 28, color: '#3b82f6' }} />, title: 'Escolha os Orçamentos', desc: 'Selecione de 2 a 5 orçamentos já cadastrados' },
              { icon: <Looks3Icon sx={{ fontSize: 28, color: '#3b82f6' }} />, title: 'Veja a Comparação', desc: 'Análise lado a lado com recomendações e IA' },
            ].map((step, i) => (
              <Box key={i} sx={{ maxWidth: 200, textAlign: 'center' }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                  {step.icon}
                </Box>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>{step.title}</Typography>
                <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">Comece selecionando um condomínio no campo acima</Typography>
            <ArrowForwardIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
          </Box>
        </Paper>
      )}

      {/* === COMPARISON RESULTS === */}
      {comparacao && (() => {
        const allCoberturas = getAllCoberturas(comparacao.orcamentos)
        const maxPreco = Math.max(...comparacao.orcamentos.map((o) => o.valorPremio || 0))
        const minPreco = Math.min(...comparacao.orcamentos.filter((o) => o.valorPremio > 0).map((o) => o.valorPremio))

        const enriched = comparacao.orcamentos.map((orc) => {
          const coberturasIncluidas = orc.coberturas.filter((c) => c.incluido)
          const coberturaPercent = allCoberturas.length > 0 ? (coberturasIncluidas.length / allCoberturas.length) * 100 : 0
          const precoBar = maxPreco > 0 ? ((orc.valorPremio || 0) / maxPreco) * 100 : 0
          const totalFranquias = coberturasIncluidas.reduce((sum, c) => sum + (c.franquia || 0), 0)

          let medals = 0
          if (orc.id === comparacao.resumo.menorPrecoId) medals++
          if (orc.id === comparacao.resumo.maiorCoberturaId) medals++
          const mCBRec = comparacao.resumo.recomendacoes.find((r) => r.tipo === 'MELHOR_CUSTO_BENEFICIO')
          if (mCBRec && mCBRec.orcamentoId === orc.id) medals++

          return { ...orc, coberturasIncluidas: coberturasIncluidas.length, coberturaPercent, precoBar, medals, totalFranquias }
        })

        const bestCobCount = Math.max(...enriched.map((e) => e.coberturasIncluidas))
        const melhorCBRec = comparacao.resumo.recomendacoes.find((r) => r.tipo === 'MELHOR_CUSTO_BENEFICIO')
        const CARD_GRADIENTS = [
          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        ]
        const hasCoberturas = allCoberturas.length > 0

        const coberturasAusentes: Record<string, string[]> = {}
        comparacao.orcamentos.forEach((orc) => {
          const incluidas = new Set(orc.coberturas.filter(c => c.incluido).map(c => c.nome))
          coberturasAusentes[orc.id] = allCoberturas.filter(c => !incluidas.has(c))
        })

        const filteredCoberturas = allCoberturas.filter(c =>
          matrixSearch ? c.toLowerCase().includes(matrixSearch.toLowerCase()) : true
        )

        const minFranquias = Math.min(...enriched.filter(e => e.totalFranquias > 0).map(e => e.totalFranquias))

        return (
        <>
          {/* Action bar */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3, justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<SaveIcon />} onClick={() => { setSaveName(`${selectedCondominioData?.nome || 'Comparacao'} - ${new Date().toLocaleDateString('pt-BR')}`); setSaveDialogOpen(true) }} size="small">
              Salvar
            </Button>
            <Button
              variant="contained"
              startIcon={pdfLoading ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
              onClick={handleExportPDF}
              disabled={pdfLoading}
              size="small"
              sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
            >
              {pdfLoading ? 'Gerando...' : 'Exportar PDF'}
            </Button>
          </Box>

          {/* === 1. RANKING CARDS === */}
          <Paper sx={{ p: 3, mb: 3, border: '2px solid #3b82f6' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Looks3Icon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" fontWeight="600">Resultado da Comparação</Typography>
              <Chip label={`${comparacao.orcamentos.length} orçamentos comparados`} color="primary" size="small" variant="outlined" />
            </Box>

            <Grid container spacing={2}>
              {enriched.map((orc, idx) => {
                const isMenorPreco = orc.id === comparacao.resumo.menorPrecoId
                const isMaiorCob = orc.id === comparacao.resumo.maiorCoberturaId
                const isMelhorCB = melhorCBRec && melhorCBRec.orcamentoId === orc.id

                return (
                  <Grid item xs={12} md={comparacao.orcamentos.length <= 2 ? 6 : comparacao.orcamentos.length === 3 ? 4 : 3} key={orc.id}>
                    <Card sx={{ borderRadius: 3, overflow: 'hidden', border: orc.medals > 0 ? '2px solid #FFD700' : '1px solid #e2e8f0' }}>
                      <Box sx={{ background: CARD_GRADIENTS[idx], p: 2.5, color: 'white', textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="800">{orc.seguradoraNome}</Typography>
                        <Typography variant="h4" fontWeight="900" sx={{ mt: 1 }}>{formatCurrency(orc.valorPremio)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 2, pt: 1.5 }}>
                        {isMenorPreco && <Chip icon={<TrendingDownIcon />} label="Menor Preco" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, '& .MuiChip-icon': { color: '#16a34a' } }} />}
                        {isMaiorCob && <Chip icon={<SecurityIcon />} label="Maior Cobertura" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600, '& .MuiChip-icon': { color: '#2563eb' } }} />}
                        {isMelhorCB && <Chip icon={<BalanceIcon />} label="Melhor Custo-Benefício" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, '& .MuiChip-icon': { color: '#d97706' } }} />}
                      </Box>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" fontWeight={600}>Coberturas</Typography>
                            <Typography variant="caption" fontWeight={600} color="primary">
                              {orc.coberturasIncluidas}/{allCoberturas.length} ({Math.round(orc.coberturaPercent)}%)
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={orc.coberturaPercent} sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: orc.coberturaPercent >= 80 ? '#22c55e' : orc.coberturaPercent >= 50 ? '#f59e0b' : '#ef4444' } }} />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                          <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <Typography variant="caption" color="text.secondary" display="block">Vigência</Typography>
                            <Typography variant="body2" fontWeight={700}>{orc.vigenciaDias} dias</Typography>
                          </Box>
                          <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <Typography variant="caption" color="text.secondary" display="block">Pagamento</Typography>
                            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.75rem' }}>{orc.formaPagamento || '-'}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {orc.condicoesEspeciais && orc.condicoesEspeciais.length > 0 && (
                            <Chip label={`${orc.condicoesEspeciais.length} condição(ões)`} size="small" variant="outlined" color="info" sx={{ height: 22 }} />
                          )}
                        </Box>
                        {hasCoberturas && orc.coberturas.length > 0 && (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Coberturas incluídas:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                              {orc.coberturas.filter((c) => c.incluido).map((c) => (
                                <Chip key={c.nome} label={c.nome} size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: comparacao.resumo.coberturasComuns.includes(c.nome) ? '#dcfce7' : '#e0f2fe', color: comparacao.resumo.coberturasComuns.includes(c.nome) ? '#166534' : '#0c4a6e' }} />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          </Paper>

          {/* === RECOMMENDATION SECTION === */}
          {comparacao.resumo.recomendacoes.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, border: '2px solid #FFD700', bgcolor: '#fffbeb' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmojiEventsIcon sx={{ color: '#ca8a04', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="700">Recomendação</Typography>
              </Box>
              <Grid container spacing={2}>
                {comparacao.resumo.recomendacoes.map((rec, idx) => {
                  const colors = getRecomendaçãoColor(rec.tipo)
                  return (
                    <Grid item xs={12} md={comparacao.resumo.recomendacoes.length === 1 ? 12 : comparacao.resumo.recomendacoes.length === 2 ? 6 : 4} key={idx}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: colors.bg, border: `1px solid ${colors.border}`, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {getRecomendaçãoIcon(rec.tipo)}
                          <Typography variant="subtitle2" fontWeight="700" sx={{ color: colors.text }}>{getRecomendaçãoLabel(rec.tipo)}</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight="800" sx={{ color: colors.text, mb: 0.5 }}>{rec.seguradora}</Typography>
                        <Typography variant="body2" sx={{ color: colors.text, opacity: 0.85 }}>{rec.justificativa}</Typography>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>
            </Paper>
          )}

          {/* === ANALISE DE COBERTURAS === */}
          {hasCoberturas && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Análise de Coberturas</Typography>
              {comparacao.resumo.coberturasComuns.length > 0 && (
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <CheckCircleIcon sx={{ color: '#16a34a' }} />
                    <Typography variant="subtitle1" fontWeight={700} color="#166534">Coberturas em Comum ({comparacao.resumo.coberturasComuns.length})</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>Presentes em todos os orçamentos comparados</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {comparacao.resumo.coberturasComuns.map((cob) => (
                      <Chip key={cob} label={cob} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 500 }} />
                    ))}
                  </Box>
                </Box>
              )}
              {Object.entries(coberturasAusentes).some(([, cobs]) => cobs.length > 0) && (
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <CancelIcon sx={{ color: '#ef4444' }} />
                    <Typography variant="subtitle1" fontWeight={700} color="#991b1b">Coberturas Ausentes por Orçamento</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>Coberturas que existem em outros orçamentos mas não neste</Typography>
                  {Object.entries(coberturasAusentes).map(([orcId, cobs]) => {
                    if (cobs.length === 0) return null
                    const orc = comparacao.orcamentos.find((o) => o.id === orcId)
                    return (
                      <Box key={orcId} sx={{ mb: 1.5 }}>
                        <Typography variant="caption" fontWeight={700} color="#991b1b">{orc?.seguradoraNome}:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.3 }}>
                          {cobs.map((cob) => <Chip key={cob} label={cob} size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 500 }} />)}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              )}
              {Object.keys(comparacao.resumo.coberturasExclusivas || {}).length > 0 && (
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fefce8', border: '1px solid #fde68a' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <StarIcon sx={{ color: '#ca8a04' }} />
                    <Typography variant="subtitle1" fontWeight={700} color="#854d0e">Coberturas Únicas</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>Presentes apenas em um orçamento específico</Typography>
                  {Object.entries(comparacao.resumo.coberturasExclusivas || {}).map(([orcId, cobs]) => {
                    const orc = comparacao.orcamentos.find((o) => o.id === orcId)
                    return (
                      <Box key={orcId} sx={{ mb: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="#92400e">{orc?.seguradoraNome}:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.3 }}>
                          {(cobs as string[]).map((cob) => <Chip key={cob} label={cob} size="small" sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 500 }} />)}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </Paper>
          )}

          {/* === COMPARACAO DE PRECOS === */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Comparação de Preços</Typography>
            <Box sx={{ mt: 2 }}>
              {enriched.sort((a, b) => (a.valorPremio || 0) - (b.valorPremio || 0)).map((orc, idx) => {
                const isBest = orc.id === comparacao.resumo.menorPrecoId
                return (
                  <Box key={orc.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {idx === 0 && <EmojiEventsIcon sx={{ color: '#ca8a04', fontSize: 20 }} />}
                        <Typography variant="body2" fontWeight={isBest ? 700 : 500}>{orc.seguradoraNome}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>{formatCurrency(orc.valorPremio)}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={orc.precoBar} sx={{ height: 28, borderRadius: 2, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { borderRadius: 2, background: isBest ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' : idx === enriched.length - 1 ? 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)' : 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)' } }} />
                    {minPreco > 0 && orc.valorPremio > minPreco && (
                      <Typography variant="caption" color="error.main" sx={{ mt: 0.3, display: 'block' }}>
                        +{formatCurrency(orc.valorPremio - minPreco)} a mais ({(((orc.valorPremio - minPreco) / minPreco) * 100).toFixed(1)}%)
                      </Typography>
                    )}
                  </Box>
                )
              })}
            </Box>
          </Paper>

          {/* === TABELA DETALHADA (with franchise totals) === */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Comparação Resumida</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#0f172a' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'white', width: 200 }}>Métrica</TableCell>
                    {enriched.map((orc) => <TableCell key={orc.id} align="center" sx={{ fontWeight: 600, color: 'white' }}>{orc.seguradoraNome}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Valor do Prêmio (anual)</TableCell>
                    {enriched.map((orc) => {
                      const best = orc.id === comparacao.resumo.menorPrecoId
                      return <TableCell key={orc.id} align="center" sx={{ bgcolor: best ? '#dcfce7' : undefined, fontWeight: best ? 700 : 400 }}>{formatCurrency(orc.valorPremio)}{best && <Chip size="small" label="Menor" color="success" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}</TableCell>
                    })}
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500, bgcolor: '#f8fafc' }}>Vigência</TableCell>
                    {enriched.map((orc) => <TableCell key={orc.id} align="center">{formatDate(orc.dataVigenciaInicio)} a {formatDate(orc.dataVigenciaFim)}<Typography variant="caption" display="block" color="text.secondary">({orc.vigenciaDias} dias)</Typography></TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500, bgcolor: '#f8fafc' }}>Forma de Pagamento</TableCell>
                    {enriched.map((orc) => <TableCell key={orc.id} align="center">{orc.formaPagamento && orc.formaPagamento !== 'À vista' ? orc.formaPagamento : '-'}</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Qtd. Coberturas</TableCell>
                    {enriched.map((orc) => {
                      const best = orc.coberturasIncluidas === bestCobCount
                      return <TableCell key={orc.id} align="center" sx={{ bgcolor: best ? '#dbeafe' : undefined, fontWeight: best ? 700 : 400 }}>{orc.coberturasIncluidas}/{allCoberturas.length}{best && allCoberturas.length > 0 && <Chip size="small" label="Mais" color="primary" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}</TableCell>
                    })}
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>
                      <Tooltip title="Soma de todas as franquias das coberturas contratadas" arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>Total Franquias<HelpOutlineIcon sx={{ fontSize: 14, color: '#94a3b8' }} /></Box>
                      </Tooltip>
                    </TableCell>
                    {enriched.map((orc) => {
                      const isBest = orc.totalFranquias > 0 && orc.totalFranquias === minFranquias
                      return <TableCell key={orc.id} align="center" sx={{ bgcolor: isBest ? '#dcfce7' : undefined, fontWeight: isBest ? 700 : 400 }}>{formatCurrency(orc.totalFranquias)}{isBest && <Chip size="small" label="Menor" color="success" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}</TableCell>
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* === MATRIZ DE COBERTURAS (sticky header, search, % diff) === */}
          {allCoberturas.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">Matriz de Coberturas</Typography>
                  <Typography variant="body2" color="text.secondary">Comparação detalhada de cada cobertura com limites e franquias</Typography>
                </Box>
                <TextField size="small" placeholder="Buscar cobertura..." value={matrixSearch} onChange={(e) => setMatrixSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }} sx={{ width: 240, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Box>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#0f172a', color: 'white', minWidth: 200, position: 'sticky', top: 0, zIndex: 2 }}>Cobertura</TableCell>
                      {comparacao.orcamentos.map((orc) => <TableCell key={orc.id} align="center" sx={{ fontWeight: 600, bgcolor: '#0f172a', color: 'white', minWidth: 160, position: 'sticky', top: 0, zIndex: 2 }}>{orc.seguradoraNome}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCoberturas.map((coberturaNome, rowIdx) => {
                      const limites = comparacao.orcamentos.map((orc) => getCoberturaValue(orc, coberturaNome)?.valorLimite || 0).filter((v) => v > 0)
                      const franquias = comparacao.orcamentos.map((orc) => getCoberturaValue(orc, coberturaNome)?.franquia || 0).filter((v) => v > 0)
                      const bestLimite = limites.length > 0 ? Math.max(...limites) : 0
                      const bestFranquia = franquias.length > 0 ? Math.min(...franquias) : 0

                      return (
                        <TableRow key={coberturaNome} sx={{ bgcolor: rowIdx % 2 === 0 ? 'white' : '#fafafa', '&:hover': { bgcolor: '#f1f5f9' } }}>
                          <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem', borderRight: '1px solid #e2e8f0' }}>{coberturaNome}</TableCell>
                          {comparacao.orcamentos.map((orc) => {
                            const cob = getCoberturaValue(orc, coberturaNome)
                            const tem = cob?.incluido
                            const isBestLimite = tem && (cob?.valorLimite || 0) === bestLimite && bestLimite > 0
                            const isBestFranquia = tem && (cob?.franquia || 0) === bestFranquia && bestFranquia > 0

                            let limiteDiffText = ''
                            if (tem && cob?.valorLimite && cob.valorLimite > 0 && bestLimite > 0 && cob.valorLimite !== bestLimite) {
                              const diff = ((cob.valorLimite - bestLimite) / bestLimite) * 100
                              limiteDiffText = `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`
                            }

                            return (
                              <TableCell key={orc.id} align="center" sx={{ bgcolor: tem ? (isBestLimite ? '#dcfce7' : '#f0fdf4') : '#fef2f2', borderLeft: '1px solid #e2e8f0' }}>
                                {tem ? (
                                  <Box>
                                    <CheckCircleIcon fontSize="small" sx={{ color: '#22c55e', verticalAlign: 'middle' }} />
                                    {cob?.valorLimite !== undefined && cob.valorLimite > 0 && (
                                      <Box>
                                        <Typography variant="caption" display="block" fontWeight={isBestLimite ? 700 : 400} color={isBestLimite ? '#166534' : 'text.primary'}>{formatCurrency(cob.valorLimite)}</Typography>
                                        {limiteDiffText && <Typography variant="caption" display="block" sx={{ color: limiteDiffText.startsWith('-') ? '#ef4444' : '#94a3b8', fontSize: '0.65rem' }}>{limiteDiffText} vs melhor</Typography>}
                                      </Box>
                                    )}
                                    {cob?.franquia !== undefined && cob.franquia > 0 && (
                                      <Typography variant="caption" display="block" color={isBestFranquia ? '#166534' : 'text.secondary'} fontWeight={isBestFranquia ? 600 : 400}>Fr: {formatCurrency(cob.franquia)} {isBestFranquia && '(menor)'}</Typography>
                                    )}
                                  </Box>
                                ) : (
                                  <Box>
                                    <CancelIcon fontSize="small" sx={{ color: '#ef4444', verticalAlign: 'middle' }} />
                                    <Typography variant="caption" display="block" color="error.main">Ausente</Typography>
                                  </Box>
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })}
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>TOTAL</TableCell>
                      {enriched.map((orc) => <TableCell key={orc.id} align="center" sx={{ fontWeight: 700, borderLeft: '1px solid #e2e8f0' }}><Typography variant="body2" fontWeight={700}>{orc.coberturasIncluidas} coberturas</Typography></TableCell>)}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              {matrixSearch && filteredCoberturas.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}><Typography color="text.secondary">Nenhuma cobertura encontrada para &quot;{matrixSearch}&quot;</Typography></Box>
              )}
              {matrixSearch && filteredCoberturas.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Mostrando {filteredCoberturas.length} de {allCoberturas.length} coberturas</Typography>
              )}
            </Paper>
          )}

          {/* === CONDICOES ESPECIAIS === */}
          {comparacao.orcamentos.some((o) => (o.condicoesEspeciais?.length || 0) > 0 || o.observacoes) && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Condições Especiais e Observações</Typography>
              <Grid container spacing={2}>
                {comparacao.orcamentos.map((orc) => (
                  ((orc.condicoesEspeciais?.length || 0) > 0 || orc.observacoes) && (
                    <Grid item xs={12} md={6} key={orc.id}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>{orc.seguradoraNome}</Typography>
                        {(orc.condicoesEspeciais?.length || 0) > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">Condições Especiais:</Typography>
                            {orc.condicoesEspeciais?.map((cond, i) => <Typography key={i} variant="body2" sx={{ ml: 1 }}>- {cond}</Typography>)}
                          </Box>
                        )}
                        {orc.observacoes && (
                          <Box>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">Observações:</Typography>
                            <Typography variant="body2" sx={{ ml: 1 }}>{orc.observacoes}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  )
                ))}
              </Grid>
            </Paper>
          )}

          {/* === ANALISE IA === */}
          <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)', border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToyIcon sx={{ color: '#6366f1' }} />
                <Typography variant="h6" fontWeight="600">Análise Inteligente</Typography>
                <Chip label="IA" size="small" sx={{ bgcolor: '#6366f1', color: 'white', height: 20, fontSize: '0.7rem' }} />
              </Box>
              {!iaAnalise && (
                <Button variant="contained" startIcon={iaLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />} onClick={handleGenerarAnaliseIA} disabled={iaLoading} sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                  {iaLoading ? 'Analisando...' : 'Gerar Análise com IA'}
                </Button>
              )}
            </Box>
            {iaLoading && !iaAnalise && (
              <Box sx={{ py: 2 }}>
                <Skeleton variant="text" width="80%" height={24} animation="wave" sx={{ mb: 1 }} />
                <Skeleton variant="text" width="95%" height={20} animation="wave" sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="90%" height={20} animation="wave" sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="85%" height={20} animation="wave" sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="60%" height={20} animation="wave" />
              </Box>
            )}
            {iaAnalise && (
              <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#374151' }}>{iaAnalise}</Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={handleGenerarAnaliseIA} disabled={iaLoading} sx={{ color: '#6366f1' }}>Gerar Nova Análise</Button>
                </Box>
              </Box>
            )}
            {!iaLoading && !iaAnalise && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <AutoAwesomeIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Clique no botão acima para gerar uma análise detalhada dos orçamentos usando inteligência artificial.</Typography>
              </Box>
            )}
          </Paper>
        </>
        )
      })()}

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Salvar Comparação</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Salve esta comparação para consultar depois sem precisar refazer.</Typography>
          <TextField fullWidth label="Nome da comparação" value={saveName} onChange={(e) => setSaveName(e.target.value)} autoFocus size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveComparison} disabled={!saveName.trim()} sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><HistoryIcon />Comparações Salvas</Box></DialogTitle>
        <DialogContent>
          {savedComparisons.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>Nenhuma comparação salva</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {savedComparisons.map((saved) => (
                <Box key={saved.id} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:hover': { bgcolor: '#f8fafc' } }}>
                  <Box sx={{ cursor: 'pointer', flex: 1 }} onClick={() => handleLoadComparison(saved)}>
                    <Typography variant="subtitle2" fontWeight="600">{saved.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{saved.condominioNome} - {saved.seguradoras.join(' vs ')}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary">{new Date(saved.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
                  </Box>
                  <Tooltip title="Excluir">
                    <Button size="small" color="error" onClick={() => handleDeleteSaved(saved.id)} sx={{ minWidth: 36 }}><DeleteIcon fontSize="small" /></Button>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setHistoryDialogOpen(false)}>Fechar</Button></DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
