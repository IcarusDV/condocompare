'use client'

import { useState, useEffect } from 'react'
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
} from '@mui/material'
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
import Checkbox from '@mui/material/Checkbox'
import { useRouter } from 'next/navigation'
import { condominioService } from '@/services/condominioService'
import { documentoService } from '@/services/documentoService'
import { iaService, DiagnosticoResponse } from '@/services/iaService'
import { CondominioListResponse, DocumentoListResponse, CoberturaDTO, CondominioResponse } from '@/types'

const getStatusGradient = (status: string) => {
  switch (status) {
    case 'adequado':
      return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
    case 'atencao':
      return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    case 'critico':
      return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    default:
      return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'adequado':
      return 'Cobertura Adequada'
    case 'atencao':
      return 'Requer Atencao'
    case 'critico':
      return 'Situacao Critica'
    default:
      return 'Analisando...'
  }
}

const getSeveridadeColor = (severidade: string) => {
  switch (severidade) {
    case 'alta':
      return 'error'
    case 'media':
      return 'warning'
    case 'baixa':
      return 'info'
    default:
      return 'default'
  }
}

const getRiscoIcon = (risco: string) => {
  const lower = risco.toLowerCase()
  if (lower.includes('incendio') || lower.includes('fogo')) return <LocalFireDepartmentIcon sx={{ fontSize: 32 }} />
  if (lower.includes('agua') || lower.includes('hidra') || lower.includes('inunda') || lower.includes('vazamento')) return <WaterDropIcon sx={{ fontSize: 32 }} />
  if (lower.includes('eletric') || lower.includes('energia') || lower.includes('curto')) return <ElectricalServicesIcon sx={{ fontSize: 32 }} />
  if (lower.includes('telhado') || lower.includes('cobertura') || lower.includes('estrutur')) return <RoofingIcon sx={{ fontSize: 32 }} />
  if (lower.includes('porta') || lower.includes('acesso') || lower.includes('portaria')) return <DoorSlidingIcon sx={{ fontSize: 32 }} />
  if (lower.includes('janela') || lower.includes('vidro') || lower.includes('fachada')) return <WindowIcon sx={{ fontSize: 32 }} />
  if (lower.includes('extintor') || lower.includes('brigada') || lower.includes('combate')) return <FireExtinguisherIcon sx={{ fontSize: 32 }} />
  if (lower.includes('legal') || lower.includes('civil') || lower.includes('responsabilidade')) return <GavelIcon sx={{ fontSize: 32 }} />
  return <SecurityIcon sx={{ fontSize: 32 }} />
}

const getSeveridadeBgColor = (severidade: string) => {
  switch (severidade) {
    case 'alta': return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '#ef4444' }
    case 'media': return { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '#f59e0b' }
    case 'baixa': return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: '#3b82f6' }
    default: return { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', icon: '#64748b' }
  }
}

export default function DiagnosticoPage() {
  const router = useRouter()
  const [condominios, setCondominios] = useState<CondominioListResponse[]>([])
  const [selectedCondominio, setSelectedCondominio] = useState<string>('')
  const [condominioDetails, setCondominioDetails] = useState<CondominioResponse | null>(null)
  const [orcamentos, setOrcamentos] = useState<DocumentoListResponse[]>([])
  const [selectedOrcamentos, setSelectedOrcamentos] = useState<string[]>([])
  const [totalCoberturas, setTotalCoberturas] = useState<number>(0)
  const [diagnostico, setDiagnostico] = useState<DiagnosticoResponse | null>(null)
  const [loadingCondominios, setLoadingCondominios] = useState(true)
  const [loadingOrcamentos, setLoadingOrcamentos] = useState(false)
  const [loadingDiagnostico, setLoadingDiagnostico] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCondominios = async () => {
      try {
        const response = await condominioService.list({}, { size: 100 })
        setCondominios(response.content)
      } catch (err) {
        console.error('Error loading condominios:', err)
        setError('Erro ao carregar condominios')
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
      setDiagnostico(null)
      setCondominioDetails(null)
      return
    }

    const loadData = async () => {
      try {
        setLoadingDetails(true)
        setLoadingOrcamentos(true)
        const details = await condominioService.getById(selectedCondominio)
        setCondominioDetails(details)
        const response = await documentoService.listByCondominioAndTipo(selectedCondominio, 'ORCAMENTO')
        const filledOrcamentos = response.filter((o) => o.status === 'CONCLUIDO')
        setOrcamentos(filledOrcamentos)
        setSelectedOrcamentos([])
        setDiagnostico(null)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoadingDetails(false)
        setLoadingOrcamentos(false)
      }
    }
    loadData()
  }, [selectedCondominio])

  // Check coberturas from selected orcamentos
  useEffect(() => {
    if (selectedOrcamentos.length === 0) {
      setTotalCoberturas(0)
      return
    }

    const checkCoberturas = async () => {
      try {
        let total = 0
        for (const orcId of selectedOrcamentos) {
          const doc = await documentoService.getById(orcId)
          const dados = doc.dadosExtraidos as { coberturas?: CoberturaDTO[] } | undefined
          total += (dados?.coberturas || []).length
        }
        setTotalCoberturas(total)
      } catch {
        setTotalCoberturas(0)
      }
    }
    checkCoberturas()
  }, [selectedOrcamentos])

  const handleAnalyze = async () => {
    if (!selectedCondominio) {
      setError('Selecione um condominio')
      return
    }

    try {
      setLoadingDiagnostico(true)
      setError(null)

      // Aggregate coberturas from all selected orcamentos
      let coberturas: CoberturaDTO[] = []
      for (const orcId of selectedOrcamentos) {
        const doc = await documentoService.getById(orcId)
        const dados = doc.dadosExtraidos as { coberturas?: CoberturaDTO[] } | undefined
        const orcCoberturas = dados?.coberturas || []
        // Merge: keep best values for each cobertura name
        orcCoberturas.forEach((c) => {
          const existing = coberturas.find((e) => e.nome === c.nome)
          if (existing) {
            if ((c.valorLimite || 0) > (existing.valorLimite || 0)) existing.valorLimite = c.valorLimite
          } else {
            coberturas.push({ ...c })
          }
        })
      }

      const result = await iaService.analyzeDiagnostico({
        condominio_id: selectedCondominio,
        coberturas: coberturas.map((c) => ({
          nome: c.nome,
          valorLimite: c.valorLimite,
          franquia: c.franquia,
          incluido: c.incluido,
        })),
      })

      setDiagnostico(result)
    } catch (err) {
      console.error('Error analyzing:', err)
      setError('Erro ao gerar diagnostico. Verifique se o servico de IA esta rodando.')
    } finally {
      setLoadingDiagnostico(false)
    }
  }

  const handleExportPDF = async () => {
    if (!diagnostico) return

    try {
      setLoadingReport(true)
      setError(null)

      // Generate report markdown via IA
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
          area: condominioDetails.caracteristicas?.areaConstruida,
        } : {},
      })

      if (!reportData.success || !reportData.relatorio_markdown) {
        setError('Erro ao gerar relatorio. Tente novamente.')
        return
      }

      // Convert markdown to PDF using jsPDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const markdown = reportData.relatorio_markdown
      const lines = markdown.split('\n')
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      const maxWidth = pageWidth - margin * 2
      let y = 20

      const addPage = () => {
        doc.addPage()
        y = 20
      }

      const checkPage = (needed: number) => {
        if (y + needed > doc.internal.pageSize.getHeight() - 20) {
          addPage()
        }
      }

      // IRC branding header
      doc.setFillColor(99, 102, 241) // #6366f1
      doc.rect(0, 0, pageWidth, 12, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.text('CondoCompare - Relatorio de Diagnostico', margin, 8)
      doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - margin, 8, { align: 'right' })
      y = 20

      doc.setTextColor(0, 0, 0)

      for (const line of lines) {
        const trimmed = line.trim()

        if (!trimmed) {
          y += 3
          continue
        }

        checkPage(10)

        // Headers
        if (trimmed.startsWith('# ')) {
          y += 4
          doc.setFontSize(18)
          doc.setFont('helvetica', 'bold')
          doc.text(trimmed.replace(/^# /, ''), margin, y)
          y += 10
        } else if (trimmed.startsWith('## ')) {
          y += 3
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text(trimmed.replace(/^## /, ''), margin, y)
          y += 8
        } else if (trimmed.startsWith('### ')) {
          y += 2
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text(trimmed.replace(/^### /, ''), margin, y)
          y += 7
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          const bulletText = trimmed.replace(/^[-*] /, '')
          const cleanText = bulletText.replace(/\*\*/g, '')
          const wrapped = doc.splitTextToSize(`  • ${cleanText}`, maxWidth - 5)
          checkPage(wrapped.length * 5)
          doc.text(wrapped, margin + 3, y)
          y += wrapped.length * 5
        } else if (trimmed.startsWith('|')) {
          // Table row - render as simple text
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          if (trimmed.includes('---')) continue // skip separator
          const cells = trimmed.split('|').filter(c => c.trim())
          const cellText = cells.map(c => c.trim()).join('  |  ')
          const wrapped = doc.splitTextToSize(cellText, maxWidth)
          checkPage(wrapped.length * 4.5)
          doc.text(wrapped, margin, y)
          y += wrapped.length * 4.5
        } else {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          const cleanText = trimmed.replace(/\*\*/g, '')
          const wrapped = doc.splitTextToSize(cleanText, maxWidth)
          checkPage(wrapped.length * 5)
          doc.text(wrapped, margin, y)
          y += wrapped.length * 5
        }
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        const pageHeight = doc.internal.pageSize.getHeight()
        doc.setFillColor(245, 245, 245)
        doc.rect(0, pageHeight - 10, pageWidth, 10, 'F')
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text(`Gerado por CondoCompare IA - ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 4)
        doc.text(`Pagina ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 4, { align: 'right' })
      }

      const condName = diagnostico.condominio_nome || 'condominio'
      const date = new Date().toISOString().split('T')[0]
      doc.save(`diagnostico_${condName.replace(/\s+/g, '_')}_${date}.pdf`)
    } catch (err) {
      console.error('Error generating report:', err)
      setError('Erro ao gerar relatorio PDF. Tente novamente.')
    } finally {
      setLoadingReport(false)
    }
  }

  const amenidadesList = condominioDetails ? [
    { label: 'Piscina', active: condominioDetails.amenidades?.temPiscina },
    { label: 'Academia', active: condominioDetails.amenidades?.temAcademia },
    { label: 'Salao', active: condominioDetails.amenidades?.temSalaoFestas },
    { label: 'Elevadores', active: (condominioDetails.caracteristicas?.numeroElevadores || 0) > 0 },
    { label: 'Portaria 24h', active: condominioDetails.amenidades?.temPortaria24h },
  ] : []

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ShieldIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold">
              Diagnostico Inteligente
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Analise completa das coberturas do seu condominio com recomendacoes baseadas em IA
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => router.push('/dashboard/assistente?context=diagnostico')}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
        >
          Perguntar a IA
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Selection Panel */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="600" gutterBottom>
          Selecionar Condominio
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel>Condominio</InputLabel>
              <Select
                value={selectedCondominio}
                label="Condominio"
                onChange={(e) => setSelectedCondominio(e.target.value)}
                disabled={loadingCondominios}
              >
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
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Orcamentos para analise (ate 4)
            </Typography>
            {loadingOrcamentos ? (
              <Skeleton variant="rounded" height={40} />
            ) : orcamentos.length === 0 ? (
              <Alert severity="info" sx={{ py: 0.5 }}>
                {selectedCondominio ? 'Nenhum orcamento preenchido encontrado' : 'Selecione um condominio'}
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {orcamentos.map((o) => {
                  const isSelected = selectedOrcamentos.includes(o.id)
                  return (
                    <Chip
                      key={o.id}
                      label={`${o.seguradoraNome || o.nome}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedOrcamentos((prev) => prev.filter((id) => id !== o.id))
                        } else if (selectedOrcamentos.length < 4) {
                          setSelectedOrcamentos((prev) => [...prev, o.id])
                        }
                      }}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      icon={<Checkbox checked={isSelected} size="small" sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 } }} />}
                      sx={{ cursor: 'pointer' }}
                    />
                  )
                })}
              </Box>
            )}
            {selectedOrcamentos.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {selectedOrcamentos.length} orcamento(s) selecionado(s)
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={loadingDiagnostico ? <CircularProgress size={20} color="inherit" /> : <AnalyticsIcon />}
              onClick={handleAnalyze}
              disabled={!selectedCondominio || loadingDiagnostico}
              sx={{ height: 56, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
            >
              Analisar
            </Button>
          </Grid>
        </Grid>

        {/* Aviso sobre coberturas */}
        {selectedCondominio && selectedOrcamentos.length > 0 && totalCoberturas > 0 && (
          <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircleIcon />}>
            <strong>{totalCoberturas} coberturas encontradas</strong> nos {selectedOrcamentos.length} orcamento(s) selecionado(s). As coberturas serao agregadas para a analise.
          </Alert>
        )}

        {selectedCondominio && selectedOrcamentos.length > 0 && totalCoberturas === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Orcamentos sem coberturas preenchidas.</strong> A analise sera feita apenas com as caracteristicas do condominio.
          </Alert>
        )}

        {selectedCondominio && selectedOrcamentos.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }} icon={<InfoOutlinedIcon />}>
            <strong>Analise geral:</strong> Sem orcamento selecionado, a IA analisara apenas as caracteristicas
            do condominio e recomendara coberturas essenciais. Selecione orcamentos para uma analise mais completa.
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
                <Grid item xs={12} md={3}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Tipo</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {condominioDetails.caracteristicas?.tipoConstrucao || 'Nao informado'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Unidades</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {condominioDetails.caracteristicas?.numeroUnidades || '-'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Blocos</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {condominioDetails.caracteristicas?.numeroBlocos || '-'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Area</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {condominioDetails.caracteristicas?.areaConstruida ? `${condominioDetails.caracteristicas.areaConstruida} m²` : '-'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Amenidades</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      {amenidadesList.filter(a => a.active).slice(0, 3).map((a, idx) => (
                        <Chip key={idx} label={a.label} size="small" sx={{ fontSize: 10 }} />
                      ))}
                      {amenidadesList.filter(a => a.active).length > 3 && (
                        <Chip label={`+${amenidadesList.filter(a => a.active).length - 3}`} size="small" sx={{ fontSize: 10 }} />
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
      </Paper>

      {/* Loading State */}
      {loadingDiagnostico && (
        <Box>
          {/* Score section skeleton */}
          <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Skeleton variant="circular" width={160} height={160} animation="wave" />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" height={40} animation="wave" />
                <Skeleton variant="text" width="70%" height={24} animation="wave" sx={{ mt: 1 }} />
                <Skeleton variant="rounded" width={150} height={32} animation="wave" sx={{ mt: 2 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" width={100} height={100} animation="wave" />
                ))}
              </Box>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Grid item xs={12} md={4} key={i}>
                    <Skeleton variant="rounded" height={180} animation="wave" />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
          {/* Recomendacoes skeleton */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Skeleton variant="text" width={200} height={32} animation="wave" sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={12} md={6} key={i}>
                  <Skeleton variant="rounded" height={120} animation="wave" />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}

      {/* Results */}
      {diagnostico && !loadingDiagnostico && (
        <>
          {/* Score Section */}
          <Paper sx={{ p: 0, mb: 3, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 4, background: getStatusGradient(diagnostico.status), color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant="determinate" value={100} size={160} thickness={4} sx={{ color: 'rgba(255,255,255,0.2)' }} />
                <CircularProgress variant="determinate" value={diagnostico.score} size={160} thickness={4} sx={{ color: 'white', position: 'absolute', left: 0 }} />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <Typography variant="h2" fontWeight="bold">{Math.round(diagnostico.score)}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>pontos</Typography>
                </Box>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>{getStatusLabel(diagnostico.status)}</Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                  {diagnostico.status === 'adequado'
                    ? 'O condominio possui uma boa cobertura de seguro. Continue monitorando.'
                    : diagnostico.status === 'atencao'
                    ? 'Algumas coberturas precisam de atencao. Revise as recomendacoes.'
                    : 'Ha lacunas importantes na cobertura. Acao imediata recomendada.'}
                </Typography>
                {diagnostico.condominio_nome && (
                  <Chip icon={<ApartmentIcon />} label={diagnostico.condominio_nome} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, minWidth: 100 }}>
                  <CheckCircleIcon sx={{ fontSize: 28, mb: 0.5 }} />
                  <Typography variant="h4" fontWeight="bold">{diagnostico.coberturas_adequadas.length}</Typography>
                  <Typography variant="caption">Adequadas</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, minWidth: 100 }}>
                  <WarningIcon sx={{ fontSize: 28, mb: 0.5 }} />
                  <Typography variant="h4" fontWeight="bold">{diagnostico.coberturas_insuficientes.length}</Typography>
                  <Typography variant="caption">Insuficientes</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, minWidth: 100 }}>
                  <ErrorIcon sx={{ fontSize: 28, mb: 0.5 }} />
                  <Typography variant="h4" fontWeight="bold">{diagnostico.coberturas_ausentes.length}</Typography>
                  <Typography variant="caption">Ausentes</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '2px solid #22c55e', borderRadius: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CheckCircleIcon sx={{ color: '#22c55e' }} />
                      <Typography variant="subtitle1" fontWeight="bold" color="#16a34a">Coberturas Adequadas</Typography>
                    </Box>
                    {diagnostico.coberturas_adequadas.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {diagnostico.coberturas_adequadas.map((cob, idx) => (
                          <Chip key={idx} label={cob} size="small" icon={<CheckCircleIcon sx={{ fontSize: 16 }} />} sx={{ justifyContent: 'flex-start', bgcolor: '#f0fdf4', color: '#166534' }} />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Nenhuma cobertura avaliada como adequada</Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '2px solid #f59e0b', borderRadius: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <WarningIcon sx={{ color: '#f59e0b' }} />
                      <Typography variant="subtitle1" fontWeight="bold" color="#d97706">Coberturas Insuficientes</Typography>
                    </Box>
                    {diagnostico.coberturas_insuficientes.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {diagnostico.coberturas_insuficientes.map((cob, idx) => (
                          <Chip key={idx} label={cob} size="small" icon={<ArrowDownwardIcon sx={{ fontSize: 16 }} />} sx={{ justifyContent: 'flex-start', bgcolor: '#fffbeb', color: '#92400e' }} />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Nenhuma cobertura com valor insuficiente</Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '2px solid #ef4444', borderRadius: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ErrorIcon sx={{ color: '#ef4444' }} />
                      <Typography variant="subtitle1" fontWeight="bold" color="#dc2626">Coberturas Ausentes</Typography>
                    </Box>
                    {diagnostico.coberturas_ausentes.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {diagnostico.coberturas_ausentes.map((cob, idx) => (
                          <Chip key={idx} label={cob} size="small" icon={<ErrorIcon sx={{ fontSize: 16 }} />} sx={{ justifyContent: 'flex-start', bgcolor: '#fef2f2', color: '#991b1b' }} />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Todas as coberturas recomendadas presentes</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Recomendacoes */}
          {diagnostico.recomendacoes.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TipsAndUpdatesIcon sx={{ color: '#6366f1', fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold">Recomendacoes</Typography>
                <Chip label={`${diagnostico.recomendacoes.length} itens`} size="small" sx={{ ml: 1 }} />
              </Box>
              <Grid container spacing={2}>
                {diagnostico.recomendacoes.sort((a, b) => b.prioridade - a.prioridade).map((rec, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Card variant="outlined" sx={{ height: '100%', borderLeft: `4px solid ${rec.tipo === 'cuidado' ? '#ef4444' : rec.tipo === 'alerta' ? '#f59e0b' : '#6366f1'}` }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={rec.tipo.toUpperCase()} size="small" color={rec.tipo === 'cuidado' ? 'error' : rec.tipo === 'alerta' ? 'warning' : 'primary'} sx={{ fontWeight: 600 }} />
                            <Chip label={rec.categoria} size="small" variant="outlined" />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, borderRadius: 1, bgcolor: rec.prioridade >= 4 ? '#fef2f2' : rec.prioridade >= 3 ? '#fffbeb' : '#f0f9ff' }}>
                            {rec.prioridade >= 4 ? <ArrowUpwardIcon sx={{ fontSize: 16, color: '#ef4444' }} /> : rec.prioridade >= 3 ? <ArrowUpwardIcon sx={{ fontSize: 16, color: '#f59e0b' }} /> : <InfoOutlinedIcon sx={{ fontSize: 16, color: '#3b82f6' }} />}
                            <Typography variant="caption" fontWeight="600" color={rec.prioridade >= 4 ? '#991b1b' : rec.prioridade >= 3 ? '#92400e' : '#1e40af'}>Prioridade {rec.prioridade}</Typography>
                          </Box>
                        </Box>
                        <Typography variant="body1" sx={{ mb: 1.5 }}>{rec.descricao}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                          <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption">Impacto: {rec.impacto}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Riscos - Visual Cards */}
          {diagnostico.riscos_identificados.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <SecurityIcon sx={{ color: '#ef4444', fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold">Riscos Identificados</Typography>
                <Chip label={`${diagnostico.riscos_identificados.length} riscos`} size="small" color="error" sx={{ ml: 1 }} />
              </Box>
              <Grid container spacing={2}>
                {diagnostico.riscos_identificados.map((risco, idx) => {
                  const colors = getSeveridadeBgColor(risco.severidade)
                  return (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Card
                        sx={{
                          height: '100%',
                          border: `1px solid ${colors.border}`,
                          bgcolor: colors.bg,
                          borderRadius: 3,
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Box sx={{ color: colors.icon }}>
                              {getRiscoIcon(risco.risco)}
                            </Box>
                            <Chip
                              label={risco.severidade.toUpperCase()}
                              size="small"
                              color={getSeveridadeColor(risco.severidade) as 'error' | 'warning' | 'info'}
                              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                            />
                          </Box>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: colors.text, mb: 1 }}>
                            {risco.risco}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                            {risco.mitigacao}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </Paper>
          )}

          {/* Actions */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleAnalyze} sx={{ borderColor: '#6366f1', color: '#6366f1' }}>
              Refazer Analise
            </Button>
            <Button
              variant="outlined"
              startIcon={loadingReport ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
              onClick={handleExportPDF}
              disabled={loadingReport}
              sx={{ borderColor: '#ef4444', color: '#ef4444', '&:hover': { borderColor: '#dc2626', bgcolor: '#fef2f2' } }}
            >
              {loadingReport ? 'Gerando...' : 'Exportar Relatorio PDF'}
            </Button>
            <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={() => router.push('/dashboard/assistente?context=diagnostico')} sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
              Tirar Duvidas com IA
            </Button>
          </Box>
        </>
      )}

      {/* Empty State */}
      {!diagnostico && !loadingDiagnostico && (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <ShieldIcon sx={{ fontSize: 40, color: '#6366f1' }} />
          </Box>
          <Typography variant="h5" fontWeight="600" gutterBottom>Selecione um condominio para comecar</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            O diagnostico inteligente analisa as caracteristicas do seu condominio e suas coberturas de seguro, identificando riscos e oportunidades de melhoria.
          </Typography>
        </Paper>
      )}
    </Box>
  )
}
