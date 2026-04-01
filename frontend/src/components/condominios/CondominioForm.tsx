'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  InputAdornment,
  Snackbar,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DescriptionIcon from '@mui/icons-material/Description'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ApartmentIcon from '@mui/icons-material/Apartment'
import PoolIcon from '@mui/icons-material/Pool'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import CelebrationIcon from '@mui/icons-material/Celebration'
import ChildCareIcon from '@mui/icons-material/ChildCare'
import OutdoorGrillIcon from '@mui/icons-material/OutdoorGrill'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import SolarPowerIcon from '@mui/icons-material/SolarPower'
import SecurityIcon from '@mui/icons-material/Security'
import PersonIcon from '@mui/icons-material/Person'
import ShieldIcon from '@mui/icons-material/Shield'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import { CreateCondominioRequest, UpdateCondominioRequest, TipoConstrucao, CondominioResponse } from '@/types'
import { condominioService } from '@/services/condominioService'
import { iaService } from '@/services/iaService'

interface CondominioFormProps {
  initialData?: CondominioResponse
  isEditing?: boolean
}

type FormData = CreateCondominioRequest

function flattenCondominioResponse(data: CondominioResponse): FormData {
  return {
    nome: data.nome,
    cnpj: data.cnpj,
    endereco: data.endereco.endereco,
    numero: data.endereco.numero,
    complemento: data.endereco.complemento,
    bairro: data.endereco.bairro,
    cidade: data.endereco.cidade,
    estado: data.endereco.estado,
    cep: data.endereco.cep,
    areaConstruida: data.caracteristicas.areaConstruida,
    areaTotal: data.caracteristicas.areaTotal,
    numeroUnidades: data.caracteristicas.numeroUnidades,
    numeroBlocos: data.caracteristicas.numeroBlocos,
    numeroElevadores: data.caracteristicas.numeroElevadores,
    numeroAndares: data.caracteristicas.numeroAndares,
    numeroFuncionarios: data.caracteristicas.numeroFuncionarios,
    anoConstrucao: data.caracteristicas.anoConstrucao,
    tipoConstrucao: data.caracteristicas.tipoConstrucao,
    temPlacasSolares: data.amenidades.temPlacasSolares,
    temPiscina: data.amenidades.temPiscina,
    temAcademia: data.amenidades.temAcademia,
    temSalaoFestas: data.amenidades.temSalaoFestas,
    temPlayground: data.amenidades.temPlayground,
    temChurrasqueira: data.amenidades.temChurrasqueira,
    temQuadra: data.amenidades.temQuadra,
    temPortaria24h: data.amenidades.temPortaria24h,
    sindicoNome: data.sindico.sindicoNome,
    sindicoEmail: data.sindico.sindicoEmail,
    sindicoTelefone: data.sindico.sindicoTelefone,
    vencimentoApolice: data.seguro.vencimentoApolice,
    seguradoraAtual: data.seguro.seguradoraAtual,
    observacoes: data.observacoes,
  }
}

const initialFormData: FormData = {
  nome: '',
  cnpj: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  areaConstruida: undefined,
  areaTotal: undefined,
  numeroUnidades: undefined,
  numeroBlocos: undefined,
  numeroElevadores: undefined,
  numeroAndares: undefined,
  numeroFuncionarios: undefined,
  anoConstrucao: undefined,
  tipoConstrucao: undefined,
  temPlacasSolares: false,
  temPiscina: false,
  temAcademia: false,
  temSalaoFestas: false,
  temPlayground: false,
  temChurrasqueira: false,
  temQuadra: false,
  temPortaria24h: false,
  sindicoNome: '',
  sindicoEmail: '',
  sindicoTelefone: '',
  vencimentoApolice: '',
  seguradoraAtual: '',
  observacoes: '',
}

const STEPS = [
  { label: 'Dados Básicos', icon: ApartmentIcon },
  { label: 'Endereço', icon: LocationOnIcon },
  { label: 'Características & Amenidades', icon: HomeWorkIcon },
  { label: 'Síndico', icon: PersonIcon },
  { label: 'Seguro', icon: ShieldIcon },
]

const amenidades = [
  { key: 'temPortaria24h' as const, label: 'Portaria 24h', icon: SecurityIcon, color: '#3b82f6' },
  { key: 'temPiscina' as const, label: 'Piscina', icon: PoolIcon, color: '#06b6d4' },
  { key: 'temAcademia' as const, label: 'Academia', icon: FitnessCenterIcon, color: '#8b5cf6' },
  { key: 'temSalaoFestas' as const, label: 'Salão de Festas', icon: CelebrationIcon, color: '#f59e0b' },
  { key: 'temPlayground' as const, label: 'Playground', icon: ChildCareIcon, color: '#10b981' },
  { key: 'temChurrasqueira' as const, label: 'Churrasqueira', icon: OutdoorGrillIcon, color: '#ef4444' },
  { key: 'temQuadra' as const, label: 'Quadra', icon: SportsSoccerIcon, color: '#22c55e' },
  { key: 'temPlacasSolares' as const, label: 'Placas Solares', icon: SolarPowerIcon, color: '#eab308' },
]

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]

export function CondominioForm({ initialData, isEditing = false }: CondominioFormProps) {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(
    initialData ? flattenCondominioResponse(initialData) : initialFormData
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'info',
  })

  // Document extraction states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractionSuccess, setExtractionSuccess] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // CEP lookup state
  const [cepLoading, setCepLoading] = useState(false)

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setCepLoading(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || prev.endereco,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
          complemento: data.complemento || prev.complemento,
        }))
        setSnackbar({ open: true, message: 'Endereço preenchido pelo CEP.', severity: 'success' })
      } else {
        setSnackbar({ open: true, message: 'CEP não encontrado.', severity: 'error' })
      }
    } catch {
      setSnackbar({ open: true, message: 'Erro ao buscar CEP.', severity: 'error' })
    } finally {
      setCepLoading(false)
    }
  }

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 0) {
      if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório'
    }
    if (step === 1) {
      if (!formData.endereco.trim()) errors.endereco = 'Endereço é obrigatório'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file)
      setExtractionSuccess(false)
      setExtractionError(null)
    } else {
      setExtractionError('Por favor, selecione um arquivo PDF.')
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setExtractionSuccess(false)
      setExtractionError(null)
    }
  }, [])

  const handleExtractData = async () => {
    if (!uploadedFile) return

    setExtracting(true)
    setExtractionError(null)

    try {
      const result = await iaService.extractCondominioData(uploadedFile)

      if (result.success && result.dados_extraidos) {
        const dados = result.dados_extraidos

        setFormData(prev => ({
          ...prev,
          nome: dados.nome || prev.nome,
          cnpj: dados.cnpj || prev.cnpj,
          endereco: dados.endereco || prev.endereco,
          numero: dados.numero ? String(dados.numero) : prev.numero,
          bairro: dados.bairro || prev.bairro,
          cidade: dados.cidade || prev.cidade,
          estado: dados.estado || prev.estado,
          cep: dados.cep || prev.cep,
          areaConstruida: dados.areaConstruida || prev.areaConstruida,
          numeroUnidades: dados.numeroUnidades || prev.numeroUnidades,
          numeroBlocos: dados.numeroBlocos || prev.numeroBlocos,
          seguradoraAtual: dados.seguradoraAtual || prev.seguradoraAtual,
          vencimentoApolice: dados.vencimentoApolice || prev.vencimentoApolice,
        }))

        setExtractionSuccess(true)
      } else {
        setExtractionError(result.message || 'Não foi possível extrair os dados do documento.')
      }
    } catch (err) {
      console.error('Error extracting data:', err)
      setExtractionError('Erro ao processar o documento. Tente novamente.')
    } finally {
      setExtracting(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return

    setLoading(true)
    setError(null)

    try {
      const dataToSend = {
        ...formData,
        areaConstruida: formData.areaConstruida ? Number(formData.areaConstruida) : undefined,
        areaTotal: formData.areaTotal ? Number(formData.areaTotal) : undefined,
        numeroUnidades: formData.numeroUnidades ? Number(formData.numeroUnidades) : undefined,
        numeroBlocos: formData.numeroBlocos ? Number(formData.numeroBlocos) : undefined,
        numeroElevadores: formData.numeroElevadores ? Number(formData.numeroElevadores) : undefined,
        numeroAndares: formData.numeroAndares ? Number(formData.numeroAndares) : undefined,
        numeroFuncionarios: formData.numeroFuncionarios ? Number(formData.numeroFuncionarios) : undefined,
        anoConstrucao: formData.anoConstrucao ? Number(formData.anoConstrucao) : undefined,
      }

      if (isEditing && initialData) {
        await condominioService.update(initialData.id, dataToSend as UpdateCondominioRequest)
      } else {
        await condominioService.create(dataToSend as CreateCondominioRequest)
      }

      router.push('/dashboard/condominios')
    } catch (err) {
      console.error('Error saving condominio:', err)
      setError('Erro ao salvar condomínio. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const completedFields = [
    formData.nome, formData.endereco, formData.cidade,
    formData.numeroUnidades, formData.tipoConstrucao,
  ].filter(Boolean).length
  const progressPercent = Math.round((completedFields / 5) * 100)

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Document import */}
            {!isEditing && (
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                  border: isDragOver ? '2px solid #6366f1' : '2px dashed #c7d2fe',
                  borderRadius: 3,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: isDragOver ? '#eef2ff' : '#fafafe',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': { borderColor: '#6366f1', bgcolor: '#f5f3ff' },
                }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {!uploadedFile ? (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 40, color: '#a5b4fc', mb: 1 }} />
                    <Typography variant="body2" fontWeight={500} color="text.secondary">
                      Arraste uma apólice/orçamento para preencher automaticamente
                    </Typography>
                  </>
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                      <DescriptionIcon sx={{ color: extractionSuccess ? '#22c55e' : '#6366f1', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>{uploadedFile.name}</Typography>
                      {extractionSuccess && <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 18 }} />}
                    </Box>
                    {extracting && <LinearProgress sx={{ borderRadius: 1, mb: 1 }} />}
                    {extractionError && <Alert severity="warning" sx={{ mb: 1, textAlign: 'left' }}>{extractionError}</Alert>}
                    {extractionSuccess && <Alert severity="success" sx={{ mb: 1, textAlign: 'left' }}>Dados extraídos! Verifique abaixo.</Alert>}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {!extractionSuccess && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={(e) => { e.stopPropagation(); handleExtractData() }}
                          disabled={extracting}
                          startIcon={extracting ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon />}
                          sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
                        >
                          {extracting ? 'Extraindo...' : 'Extrair Dados'}
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setExtractionSuccess(false); setExtractionError(null) }}
                        sx={{ borderColor: '#c7d2fe', color: '#6366f1' }}
                      >
                        Remover
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Form fields */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                required
                label="Nome do Condomínio"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                error={!!validationErrors.nome}
                helperText={validationErrors.nome}
              />
              <TextField
                fullWidth
                label="CNPJ"
                value={formData.cnpj || ''}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                placeholder="00.000.000/0001-00"
              />
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.tipoConstrucao || ''}
                  label="Tipo"
                  onChange={(e) => handleChange('tipoConstrucao', e.target.value as TipoConstrucao)}
                >
                  <MenuItem value="">Selecione</MenuItem>
                  <MenuItem value="RESIDENCIAL">Residencial</MenuItem>
                  <MenuItem value="COMERCIAL">Comercial</MenuItem>
                  <MenuItem value="MISTO">Misto</MenuItem>
                  <MenuItem value="OUTROS">Outros</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Observações"
              value={formData.observacoes || ''}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              placeholder="Informações adicionais..."
            />
          </Box>
        )

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="CEP"
                value={formData.cep || ''}
                onChange={(e) => {
                  handleChange('cep', e.target.value)
                  const clean = e.target.value.replace(/\D/g, '')
                  if (clean.length === 8) handleCepLookup(e.target.value)
                }}
                placeholder="00000-000"
                InputProps={{
                  endAdornment: cepLoading ? (
                    <InputAdornment position="end">
                      <CircularProgress size={18} />
                    </InputAdornment>
                  ) : (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        disabled={!formData.cep || formData.cep.replace(/\D/g, '').length !== 8}
                        onClick={() => handleCepLookup(formData.cep || '')}
                        sx={{ minWidth: 'auto', textTransform: 'none' }}
                      >
                        Buscar
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
              <Box />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr 2fr' }, gap: 2 }}>
              <TextField
                fullWidth
                required
                label="Endereço"
                value={formData.endereco}
                onChange={(e) => handleChange('endereco', e.target.value)}
                error={!!validationErrors.endereco}
                helperText={validationErrors.endereco}
              />
              <TextField
                fullWidth
                label="Número"
                value={formData.numero || ''}
                onChange={(e) => handleChange('numero', e.target.value)}
              />
              <TextField
                fullWidth
                label="Complemento"
                value={formData.complemento || ''}
                onChange={(e) => handleChange('complemento', e.target.value)}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 2fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Bairro"
                value={formData.bairro || ''}
                onChange={(e) => handleChange('bairro', e.target.value)}
              />
              <TextField
                fullWidth
                label="Cidade"
                value={formData.cidade || ''}
                onChange={(e) => handleChange('cidade', e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel>UF</InputLabel>
                <Select
                  value={formData.estado || ''}
                  label="UF"
                  onChange={(e) => handleChange('estado', e.target.value)}
                >
                  <MenuItem value="">-</MenuItem>
                  {UF_LIST.map(uf => (
                    <MenuItem key={uf} value={uf}>{uf}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        )

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Características */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Área Construída (m²)"
                value={formData.areaConstruida || ''}
                onChange={(e) => handleChange('areaConstruida', e.target.value)}
              />
              <TextField
                fullWidth
                type="number"
                label="Unidades"
                value={formData.numeroUnidades || ''}
                onChange={(e) => handleChange('numeroUnidades', e.target.value)}
              />
              <TextField
                fullWidth
                type="number"
                label="Blocos"
                value={formData.numeroBlocos || ''}
                onChange={(e) => handleChange('numeroBlocos', e.target.value)}
              />
              <TextField
                fullWidth
                type="number"
                label="Elevadores"
                value={formData.numeroElevadores || ''}
                onChange={(e) => handleChange('numeroElevadores', e.target.value)}
              />
              <TextField
                fullWidth
                type="number"
                label="Andares"
                value={formData.numeroAndares || ''}
                onChange={(e) => handleChange('numeroAndares', e.target.value)}
              />
              <TextField
                fullWidth
                type="number"
                label="Funcionários"
                value={formData.numeroFuncionarios || ''}
                onChange={(e) => handleChange('numeroFuncionarios', e.target.value)}
              />
              <TextField
                fullWidth
                type="number"
                label="Ano Construção"
                value={formData.anoConstrucao || ''}
                onChange={(e) => handleChange('anoConstrucao', e.target.value)}
              />
            </Box>

            {/* Amenidades */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>Amenidades</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              {amenidades.map((amenidade) => {
                const Icon = amenidade.icon
                const isActive = !!formData[amenidade.key]
                return (
                  <Paper
                    key={amenidade.key}
                    onClick={() => handleChange(amenidade.key, !formData[amenidade.key])}
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: isActive ? amenidade.color : 'divider',
                      bgcolor: isActive ? `${amenidade.color}10` : 'transparent',
                      borderRadius: 3,
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: amenidade.color,
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isActive ? `${amenidade.color}20` : '#f3f4f6',
                        mx: 'auto',
                        mb: 1,
                      }}
                    >
                      <Icon sx={{ fontSize: 24, color: isActive ? amenidade.color : '#9ca3af' }} />
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={isActive ? 600 : 400}
                      color={isActive ? 'text.primary' : 'text.secondary'}
                    >
                      {amenidade.label}
                    </Typography>
                    {isActive && (
                      <Chip
                        label="Ativo"
                        size="small"
                        sx={{
                          mt: 0.5,
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: amenidade.color,
                          color: 'white',
                        }}
                      />
                    )}
                  </Paper>
                )
              })}
            </Box>
          </Box>
        )

      case 3:
        return (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Nome do Síndico"
              value={formData.sindicoNome || ''}
              onChange={(e) => handleChange('sindicoNome', e.target.value)}
            />
            <TextField
              fullWidth
              type="email"
              label="E-mail"
              value={formData.sindicoEmail || ''}
              onChange={(e) => handleChange('sindicoEmail', e.target.value)}
            />
            <TextField
              fullWidth
              label="Telefone"
              value={formData.sindicoTelefone || ''}
              onChange={(e) => handleChange('sindicoTelefone', e.target.value)}
            />
          </Box>
        )

      case 4:
        return (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Seguradora Atual"
              value={formData.seguradoraAtual || ''}
              onChange={(e) => handleChange('seguradoraAtual', e.target.value)}
            />
            <TextField
              fullWidth
              type="date"
              label="Vencimento da Apólice"
              value={formData.vencimentoApolice || ''}
              onChange={(e) => handleChange('vencimentoApolice', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {isEditing ? 'Editar Condomínio' : 'Novo Condomínio'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isEditing ? 'Atualize as informações do condomínio' : 'Preencha as informações do novo condomínio'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Voltar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Progress indicator */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progresso do preenchimento
          </Typography>
          <Typography variant="body2" fontWeight={600} color="primary">
            {progressPercent}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: '#e5e7eb',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              bgcolor: progressPercent === 100 ? '#16a34a' : '#3b82f6',
            },
          }}
        />
      </Paper>

      {/* Stepper */}
      <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            return (
              <Step key={step.label}>
                <StepLabel
                  onClick={() => {
                    if (index < activeStep || (index > activeStep && validateStep(activeStep))) {
                      setActiveStep(index)
                    }
                  }}
                  sx={{ cursor: 'pointer' }}
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: index <= activeStep ? '#3b82f6' : index < activeStep ? '#16a34a' : '#e5e7eb',
                        transition: 'all 0.2s',
                      }}
                    >
                      {index < activeStep ? (
                        <CheckCircleIcon sx={{ fontSize: 20, color: 'white' }} />
                      ) : (
                        <StepIcon sx={{ fontSize: 20, color: index === activeStep ? 'white' : '#9ca3af' }} />
                      )}
                    </Box>
                  )}
                >
                  <Typography fontWeight={index === activeStep ? 600 : 400}>
                    {step.label}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ pt: 1, pb: 2 }}>
                    {renderStepContent(index)}
                  </Box>

                  {/* Step navigation */}
                  <Box sx={{ display: 'flex', gap: 1, pt: 2 }}>
                    {index > 0 && (
                      <Button variant="outlined" onClick={handleBack} size="small">
                        Anterior
                      </Button>
                    )}
                    {index < STEPS.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        endIcon={<ArrowForwardIcon />}
                        size="small"
                        sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                      >
                        Próximo
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                        disabled={loading}
                        size="small"
                        sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                      >
                        {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Condomínio'}
                      </Button>
                    )}
                  </Box>
                </StepContent>
              </Step>
            )
          })}
        </Stepper>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
