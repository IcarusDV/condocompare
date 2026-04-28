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
import LocalParkingIcon from '@mui/icons-material/LocalParking'
import StorefrontIcon from '@mui/icons-material/Storefront'
import ElectricCarIcon from '@mui/icons-material/ElectricCar'
import PedalBikeIcon from '@mui/icons-material/PedalBike'
import { CreateCondominioRequest, UpdateCondominioRequest, TipoConstrucao, CondominioResponse, TipoDocumento } from '@/types'
import { condominioService } from '@/services/condominioService'
import { cnpjService } from '@/services/cnpjService'
import { documentoService } from '@/services/documentoService'
import { iaService } from '@/services/iaService'

/**
 * Detecta o tipo de documento pelo nome do arquivo
 */
const detectarTipoDocumento = (filename: string): TipoDocumento => {
  const lower = filename.toLowerCase()
  if (lower.includes('apolice') || lower.includes('apólice')) return 'APOLICE'
  if (lower.includes('orcamento') || lower.includes('orçamento') || lower.includes('cotac') || lower.includes('cotaç')) return 'ORCAMENTO'
  if (lower.includes('condicoes') || lower.includes('condições gerais')) return 'CONDICOES_GERAIS'
  if (lower.includes('vistoria')) return 'LAUDO_VISTORIA'
  if (lower.includes('sinistro')) return 'SINISTRO'
  if (lower.includes('convenc') || lower.includes('convenç')) return 'CONVENCAO'
  if (lower.includes('regimento')) return 'REGIMENTO_INTERNO'
  if (lower.includes('ata')) return 'ATA_ASSEMBLEIA'
  if (lower.includes('habite')) return 'HABITE_SE'
  if (lower.includes('avcb') || lower.includes('bombeiros')) return 'AVCB'
  if (lower.includes('alvara') || lower.includes('alvará')) return 'ALVARA'
  if (lower.includes('laudo')) return 'LAUDO_TECNICO'
  if (lower.includes('planta')) return 'PLANTA'
  if (lower.includes('contrato')) return 'CONTRATO'
  // Detecta seguradoras (Allianz, AXA, etc.) → orçamento
  const seguradoras = ['allianz', 'axa', 'chubb', 'hdi', 'tokio', 'porto seguro', 'mapfre', 'bradesco', 'sulamerica', 'liberty', 'zurich']
  if (seguradoras.some(s => lower.includes(s))) return 'ORCAMENTO'
  return 'OUTRO'
}

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
    possuiAreaComercial: data.amenidades.possuiAreaComercial ?? false,
    tamanhoAreaComercial: data.amenidades.tamanhoAreaComercial,
    numFuncionariosRegistrados: data.amenidades.numFuncionariosRegistrados,
    idadeFuncionariosRegistrados: data.amenidades.idadeFuncionariosRegistrados ?? '',
    numPavimentos: data.amenidades.numPavimentos,
    possuiGaragem: data.amenidades.possuiGaragem ?? false,
    vagasGaragem: data.amenidades.vagasGaragem,
    espacosConveniencia: data.amenidades.espacosConveniencia ?? [],
    espacosConvenienciaOutros: '',
    sistemaProtecaoIncendio: data.amenidades.sistemaProtecaoIncendio ?? [],
    sistemaProtecaoIncendioOutros: '',
    possuiRecargaEletricos: data.amenidades.possuiRecargaEletricos ?? false,
    possuiBicicletario: data.amenidades.possuiBicicletario ?? false,
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
  possuiAreaComercial: false,
  tamanhoAreaComercial: undefined,
  numFuncionariosRegistrados: undefined,
  idadeFuncionariosRegistrados: '',
  numPavimentos: undefined,
  possuiGaragem: false,
  vagasGaragem: undefined,
  espacosConveniencia: [],
  espacosConvenienciaOutros: '',
  sistemaProtecaoIncendio: [],
  sistemaProtecaoIncendioOutros: '',
  possuiRecargaEletricos: false,
  possuiBicicletario: false,
  sindicoNome: '',
  sindicoEmail: '',
  sindicoTelefone: '',
  vencimentoApolice: '',
  bonusAnosSemSinistro: '',
  quantidadeSinistros: '',
  numeroCasas: undefined,
  numeroSalas: undefined,
  seguradoraAtual: '',
  observacoes: '',
}

const STEPS = [
  { label: 'Dados Básicos', icon: ApartmentIcon },
  { label: 'Endereço', icon: LocationOnIcon },
  { label: 'Características & Estrutura', icon: HomeWorkIcon },
  { label: 'Síndico', icon: PersonIcon },
  { label: 'Seguro', icon: ShieldIcon },
]

const estruturaToggles = [
  { key: 'temPortaria24h' as const, label: 'Portaria 24h', icon: SecurityIcon, color: '#3b82f6' },
  { key: 'temPiscina' as const, label: 'Piscina', icon: PoolIcon, color: '#06b6d4' },
  { key: 'temAcademia' as const, label: 'Academia', icon: FitnessCenterIcon, color: '#8b5cf6' },
  { key: 'temSalaoFestas' as const, label: 'Salão de Festas', icon: CelebrationIcon, color: '#f59e0b' },
  { key: 'temPlayground' as const, label: 'Playground', icon: ChildCareIcon, color: '#10b981' },
  { key: 'temChurrasqueira' as const, label: 'Churrasqueira', icon: OutdoorGrillIcon, color: '#ef4444' },
  { key: 'temQuadra' as const, label: 'Quadra', icon: SportsSoccerIcon, color: '#22c55e' },
  { key: 'temPlacasSolares' as const, label: 'Placas Solares', icon: SolarPowerIcon, color: '#eab308' },
]

const ESPACOS_CONVENIENCIA_OPTIONS = ['Minimercado', 'Farmacia', 'Outros']
const SISTEMA_PROTECAO_INCENDIO_OPTIONS = ['Extintores', 'Hidrantes', 'Alarme de Incendio', 'Sprinklers', 'Outros']

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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [extracting, setExtracting] = useState(false)
  const [extractionSuccess, setExtractionSuccess] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // CEP lookup state
  const [cepLoading, setCepLoading] = useState(false)
  const [cnpjLoading, setCnpjLoading] = useState(false)

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

  const handleCnpjLookup = async (cnpj: string) => {
    const clean = cnpj.replace(/\D/g, '')
    if (clean.length !== 14) return

    setCnpjLoading(true)
    try {
      const data = await cnpjService.buscar(clean)
      const anoConstrucao = data.dataAbertura
        ? Number(data.dataAbertura.slice(0, 4))
        : undefined
      setFormData(prev => ({
        ...prev,
        nome: prev.nome || data.razaoSocial || data.nomeFantasia || '',
        endereco: prev.endereco || data.logradouro || '',
        numero: prev.numero || data.numero || '',
        complemento: prev.complemento || data.complemento || '',
        bairro: prev.bairro || data.bairro || '',
        cidade: prev.cidade || data.municipio || '',
        estado: prev.estado || data.uf || '',
        cep: prev.cep || data.cep || '',
        anoConstrucao: prev.anoConstrucao || anoConstrucao,
      }))
      setSnackbar({ open: true, message: 'Dados preenchidos via Receita Federal.', severity: 'success' })
    } catch {
      // silencioso — CNPJ pode estar incompleto durante digitação
    } finally {
      setCnpjLoading(false)
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
      if (!formData.cnpj?.trim()) errors.cnpj = 'CNPJ é obrigatório'
    }
    if (step === 1) {
      if (!formData.endereco.trim()) errors.endereco = 'Endereço é obrigatório'
      if (!formData.numero?.trim()) errors.numero = 'Número é obrigatório'
      if (!formData.bairro?.trim()) errors.bairro = 'Bairro é obrigatório'
      if (!formData.cidade?.trim()) errors.cidade = 'Cidade é obrigatória'
      if (!formData.estado?.trim()) errors.estado = 'UF é obrigatória'
      if (!formData.cep?.trim()) errors.cep = 'CEP é obrigatório'
    }
    if (step === 2) {
      if (!formData.areaConstruida) errors.areaConstruida = 'Área construída é obrigatória'
      if (!formData.numeroUnidades) errors.numeroUnidades = 'Número de unidades é obrigatório'
      if (formData.numeroBlocos === undefined || formData.numeroBlocos === null) errors.numeroBlocos = 'Número de blocos é obrigatório'
      if (formData.numeroElevadores === undefined || formData.numeroElevadores === null) errors.numeroElevadores = 'Número de elevadores é obrigatório'
      if (!formData.numeroAndares) errors.numeroAndares = 'Número de andares é obrigatório'
      if (formData.numeroFuncionarios === undefined || formData.numeroFuncionarios === null) errors.numeroFuncionarios = 'Número de funcionários é obrigatório'
      if (!formData.anoConstrucao) errors.anoConstrucao = 'Ano de construção é obrigatório'
      if (!formData.tipoConstrucao) errors.tipoConstrucao = 'Tipo é obrigatório'
    }
    if (step === 3) {
      if (!formData.sindicoNome?.trim()) errors.sindicoNome = 'Nome do síndico é obrigatório'
      if (!formData.sindicoEmail?.trim()) errors.sindicoEmail = 'E-mail do síndico é obrigatório'
      if (!formData.sindicoTelefone?.trim()) errors.sindicoTelefone = 'Telefone do síndico é obrigatório'
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
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files])
      setUploadedFile(files[0])
      setExtractionSuccess(false)
      setExtractionError(null)
    } else {
      setExtractionError('Por favor, selecione arquivos PDF.')
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === 'application/pdf')
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files])
      setUploadedFile(files[0])
      setExtractionSuccess(false)
      setExtractionError(null)
    }
  }, [])

  const handleExtractData = async () => {
    const filesToProcess = uploadedFiles.length > 0 ? uploadedFiles : (uploadedFile ? [uploadedFile] : [])
    if (filesToProcess.length === 0) return

    setExtracting(true)
    setExtractionError(null)

    try {
      let successCount = 0
      for (const file of filesToProcess) {
        try {
          const result = await iaService.extractCondominioData(file)

          if (result.success && result.dados_extraidos) {
            const dados = result.dados_extraidos

            // Merge data - only fill empty fields (don't overwrite existing)
            setFormData(prev => ({
              ...prev,
              nome: prev.nome || dados.nome || '',
              cnpj: prev.cnpj || dados.cnpj || '',
              endereco: prev.endereco || dados.endereco || '',
              numero: prev.numero || (dados.numero ? String(dados.numero) : ''),
              bairro: prev.bairro || dados.bairro || '',
              cidade: prev.cidade || dados.cidade || '',
              estado: prev.estado || dados.estado || '',
              cep: prev.cep || dados.cep || '',
              areaConstruida: prev.areaConstruida || dados.areaConstruida || prev.areaConstruida,
              numeroUnidades: prev.numeroUnidades || dados.numeroUnidades || prev.numeroUnidades,
              numeroBlocos: prev.numeroBlocos || dados.numeroBlocos || prev.numeroBlocos,
              seguradoraAtual: prev.seguradoraAtual || dados.seguradoraAtual || prev.seguradoraAtual,
              vencimentoApolice: prev.vencimentoApolice || dados.vencimentoApolice || prev.vencimentoApolice,
            }))

            successCount++
          }
        } catch (fileErr) {
          console.error(`Error extracting from ${file.name}:`, fileErr)
        }
      }

      if (successCount > 0) {
        setExtractionSuccess(true)
      } else {
        setExtractionError('Não foi possível extrair os dados dos documentos.')
      }
    } catch (err) {
      console.error('Error extracting data:', err)
      setExtractionError('Erro ao processar os documentos. Tente novamente.')
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
        tamanhoAreaComercial: formData.tamanhoAreaComercial ? Number(formData.tamanhoAreaComercial) : undefined,
        numFuncionariosRegistrados: formData.numFuncionariosRegistrados ? Number(formData.numFuncionariosRegistrados) : undefined,
        numPavimentos: formData.numPavimentos ? Number(formData.numPavimentos) : undefined,
        vagasGaragem: formData.vagasGaragem ? Number(formData.vagasGaragem) : undefined,
      }

      let condominioId: string
      if (isEditing && initialData) {
        const updated = await condominioService.update(initialData.id, dataToSend as UpdateCondominioRequest)
        condominioId = updated.id
      } else {
        const created = await condominioService.create(dataToSend as CreateCondominioRequest)
        condominioId = created.id
      }

      // Upload dos documentos importados durante o cadastro
      const filesToUpload = uploadedFiles.length > 0 ? uploadedFiles : (uploadedFile ? [uploadedFile] : [])
      if (filesToUpload.length > 0 && !isEditing) {
        for (const file of filesToUpload) {
          try {
            const tipo = detectarTipoDocumento(file.name)
            const nome = file.name.replace(/\.[^/.]+$/, '') // remove extensão
            await documentoService.upload({
              file,
              condominioId,
              tipo,
              nome,
            })
          } catch (uploadErr) {
            console.error(`Erro ao fazer upload de ${file.name}:`, uploadErr)
          }
        }
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
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {uploadedFiles.length === 0 && !uploadedFile ? (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 40, color: '#a5b4fc', mb: 1 }} />
                    <Typography variant="body2" fontWeight={500} color="text.secondary">
                      Arraste apólices/orçamentos para preencher automaticamente
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Aceita múltiplos PDFs
                    </Typography>
                  </>
                ) : (
                  <Box>
                    {uploadedFiles.map((file, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                        <DescriptionIcon sx={{ color: extractionSuccess ? '#22c55e' : '#6366f1', fontSize: 18 }} />
                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>{file.name}</Typography>
                        {extractionSuccess && <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 16 }} />}
                      </Box>
                    ))}
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
                        onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setUploadedFiles([]); setExtractionSuccess(false); setExtractionError(null) }}
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
                required
                label="CNPJ"
                value={formData.cnpj || ''}
                onChange={(e) => {
                  handleChange('cnpj', e.target.value)
                  const clean = e.target.value.replace(/\D/g, '')
                  if (clean.length === 14) handleCnpjLookup(e.target.value)
                }}
                placeholder="00.000.000/0001-00"
                error={!!validationErrors.cnpj}
                helperText={validationErrors.cnpj || (cnpjLoading ? 'Consultando Receita Federal...' : ' ')}
                InputProps={{
                  endAdornment: cnpjLoading ? (
                    <InputAdornment position="end"><CircularProgress size={18} /></InputAdornment>
                  ) : undefined,
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.tipoConstrucao || ''}
                  label="Tipo"
                  onChange={(e) => handleChange('tipoConstrucao', e.target.value as TipoConstrucao)}
                >
                  <MenuItem value="">Selecione</MenuItem>
                  <MenuItem value="RESIDENCIAL">Apenas Residencial</MenuItem>
                  <MenuItem value="RESIDENCIAL_HORIZONTAL">Apenas Residencial - Horizontal</MenuItem>
                  <MenuItem value="RESIDENCIAL_COM_ESCRITORIOS">Residencial com escritórios e/ou consultórios</MenuItem>
                  <MenuItem value="COMERCIAL_VERTICAL">Apenas Comercial - Vertical</MenuItem>
                  <MenuItem value="COMERCIAL_HORIZONTAL">Apenas Comercial - Horizontal</MenuItem>
                  <MenuItem value="ESCRITORIOS_CONSULTORIOS">Apenas Escritórios e Consultórios</MenuItem>
                  <MenuItem value="ESCRITORIOS_COM_COMERCIO">Escritórios e Consultórios com Comércio no Térreo</MenuItem>
                  <MenuItem value="LOGISTICO_INDUSTRIAL">Logístico / Industrial</MenuItem>
                  <MenuItem value="CENTRO_COMERCIAL">Centro Comercial</MenuItem>
                  <MenuItem value="GALERIA_COMERCIAL">Galeria Comercial</MenuItem>
                  <MenuItem value="SHOPPING_CENTER">Shopping Center</MenuItem>
                  <MenuItem value="EDIFICIO_GARAGEM">Edifício Garagem</MenuItem>
                  <MenuItem value="MISTO">Misto</MenuItem>
                  <MenuItem value="FLAT_APART_HOTEL">Flat / Apart-hotel</MenuItem>
                  <MenuItem value="FLAT_COM_COMERCIO">Flat / Apart-hotel com comércio</MenuItem>
                  <MenuItem value="HOTEL">Hotel</MenuItem>
                  <MenuItem value="EM_CONSTRUCAO">Em construção</MenuItem>
                  <MenuItem value="DESOCUPADO">Desocupado</MenuItem>
                  <MenuItem value="OUTROS">Outros</MenuItem>
                </Select>
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ mt: 0.5, display: 'block', cursor: 'pointer', textDecoration: 'underline', '&:hover': { color: 'primary.dark' } }}
                  onClick={() => router.push('/dashboard/assistente')}
                >
                  💡 Dúvidas no TIPO? Solicite auxílio para a IA no Assistente.
                </Typography>
              </FormControl>
            </Box>
            {/* Campos condicionais por tipo */}
            {(formData.tipoConstrucao === 'RESIDENCIAL_HORIZONTAL') && (
              <TextField fullWidth type="number" label="N° de Casas" value={formData.numeroCasas || ''} onChange={(e) => handleChange('numeroCasas', e.target.value)} />
            )}
            {(formData.tipoConstrucao === 'COMERCIAL_HORIZONTAL') && (
              <TextField fullWidth type="number" label="N° de Salas" value={formData.numeroSalas || ''} onChange={(e) => handleChange('numeroSalas', e.target.value)} />
            )}
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
                required
                label="CEP"
                error={!!validationErrors.cep}
                helperText={validationErrors.cep}
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
                required
                label="Número"
                value={formData.numero || ''}
                onChange={(e) => handleChange('numero', e.target.value)}
                error={!!validationErrors.numero}
                helperText={validationErrors.numero}
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
                required
                label="Bairro"
                value={formData.bairro || ''}
                onChange={(e) => handleChange('bairro', e.target.value)}
                error={!!validationErrors.bairro}
                helperText={validationErrors.bairro}
              />
              <TextField
                fullWidth
                required
                label="Cidade"
                value={formData.cidade || ''}
                onChange={(e) => handleChange('cidade', e.target.value)}
                error={!!validationErrors.cidade}
                helperText={validationErrors.cidade}
              />
              <FormControl fullWidth required error={!!validationErrors.estado}>
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
                {validationErrors.estado && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>{validationErrors.estado}</Typography>
                )}
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
                required
                type="number"
                label="Área Construída (m²)"
                value={formData.areaConstruida || ''}
                onChange={(e) => handleChange('areaConstruida', e.target.value)}
                error={!!validationErrors.areaConstruida}
                helperText={validationErrors.areaConstruida}
              />
              <TextField
                fullWidth
                required
                type="number"
                label="Unidades"
                value={formData.numeroUnidades || ''}
                onChange={(e) => handleChange('numeroUnidades', e.target.value)}
                error={!!validationErrors.numeroUnidades}
                helperText={validationErrors.numeroUnidades}
              />
              <TextField
                fullWidth
                required
                type="number"
                label="Blocos"
                value={formData.numeroBlocos ?? ''}
                onChange={(e) => handleChange('numeroBlocos', e.target.value)}
                error={!!validationErrors.numeroBlocos}
                helperText={validationErrors.numeroBlocos}
              />
              <TextField
                fullWidth
                required
                type="number"
                label="Elevadores"
                value={formData.numeroElevadores ?? ''}
                onChange={(e) => handleChange('numeroElevadores', e.target.value)}
                error={!!validationErrors.numeroElevadores}
                helperText={validationErrors.numeroElevadores}
              />
              <TextField
                fullWidth
                required
                type="number"
                label="Andares"
                value={formData.numeroAndares || ''}
                onChange={(e) => handleChange('numeroAndares', e.target.value)}
                error={!!validationErrors.numeroAndares}
                helperText={validationErrors.numeroAndares}
              />
              <TextField
                fullWidth
                required
                type="number"
                label="Funcionários"
                value={formData.numeroFuncionarios ?? ''}
                onChange={(e) => handleChange('numeroFuncionarios', e.target.value)}
                error={!!validationErrors.numeroFuncionarios}
                helperText={validationErrors.numeroFuncionarios}
              />
              <TextField
                fullWidth
                required
                type="number"
                label="Ano Construção"
                value={formData.anoConstrucao || ''}
                onChange={(e) => handleChange('anoConstrucao', e.target.value)}
                error={!!validationErrors.anoConstrucao}
                helperText={validationErrors.anoConstrucao}
              />
            </Box>

            {/* Aviso de cobertura de vida quando há funcionários */}
            {((formData.numeroFuncionarios && formData.numeroFuncionarios > 0) ||
              (formData.numFuncionariosRegistrados && formData.numFuncionariosRegistrados > 0)) && (
              <Alert severity="warning" icon={<SecurityIcon />} sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight={600}>Cobertura de Vida Obrigatória</Typography>
                <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                  Conforme convenção coletiva vigente no município/região, é obrigatória a contratação
                  de seguro de vida para os funcionários registrados do condomínio.
                </Typography>
              </Alert>
            )}

            {/* Estrutura */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>Estrutura</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              {estruturaToggles.map((item) => {
                const Icon = item.icon
                const isActive = !!formData[item.key]
                return (
                  <Paper
                    key={item.key}
                    onClick={() => handleChange(item.key, !formData[item.key])}
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: isActive ? item.color : 'divider',
                      bgcolor: isActive ? `${item.color}10` : 'transparent',
                      borderRadius: 3,
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: item.color,
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
                        bgcolor: isActive ? `${item.color}20` : '#f3f4f6',
                        mx: 'auto',
                        mb: 1,
                      }}
                    >
                      <Icon sx={{ fontSize: 24, color: isActive ? item.color : '#9ca3af' }} />
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={isActive ? 600 : 400}
                      color={isActive ? 'text.primary' : 'text.secondary'}
                    >
                      {item.label}
                    </Typography>
                    {isActive && (
                      <Chip
                        label="Ativo"
                        size="small"
                        sx={{
                          mt: 0.5,
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: item.color,
                          color: 'white',
                        }}
                      />
                    )}
                  </Paper>
                )
              })}

              {/* Additional toggle cards */}
              {[
                { key: 'possuiAreaComercial' as const, label: 'Area Comercial', icon: StorefrontIcon, color: '#f97316' },
                { key: 'possuiGaragem' as const, label: 'Garagem', icon: LocalParkingIcon, color: '#6366f1' },
                { key: 'possuiRecargaEletricos' as const, label: 'Recarga Eletricos', icon: ElectricCarIcon, color: '#14b8a6' },
                { key: 'possuiBicicletario' as const, label: 'Bicicletario', icon: PedalBikeIcon, color: '#84cc16' },
              ].map((item) => {
                const Icon = item.icon
                const isActive = !!formData[item.key]
                return (
                  <Paper
                    key={item.key}
                    onClick={() => handleChange(item.key, !formData[item.key])}
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: isActive ? item.color : 'divider',
                      bgcolor: isActive ? `${item.color}10` : 'transparent',
                      borderRadius: 3,
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: item.color,
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
                        bgcolor: isActive ? `${item.color}20` : '#f3f4f6',
                        mx: 'auto',
                        mb: 1,
                      }}
                    >
                      <Icon sx={{ fontSize: 24, color: isActive ? item.color : '#9ca3af' }} />
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={isActive ? 600 : 400}
                      color={isActive ? 'text.primary' : 'text.secondary'}
                    >
                      {item.label}
                    </Typography>
                    {isActive && (
                      <Chip
                        label="Ativo"
                        size="small"
                        sx={{
                          mt: 0.5,
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: item.color,
                          color: 'white',
                        }}
                      />
                    )}
                  </Paper>
                )
              })}
            </Box>

            {/* Conditional fields for Area Comercial */}
            {formData.possuiAreaComercial && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tamanho Area Comercial (m2)"
                  value={formData.tamanhoAreaComercial || ''}
                  onChange={(e) => handleChange('tamanhoAreaComercial', e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end">m2</InputAdornment> }}
                />
              </Box>
            )}

            {/* Conditional fields for Garagem */}
            {formData.possuiGaragem && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Vagas de Garagem"
                  value={formData.vagasGaragem || ''}
                  onChange={(e) => handleChange('vagasGaragem', e.target.value)}
                />
              </Box>
            )}

            {/* Additional numeric/text fields */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Numero de Pavimentos"
                value={formData.numPavimentos || ''}
                onChange={(e) => handleChange('numPavimentos', e.target.value)}
              />
              <TextField
                fullWidth
                type="number"
                label="Funcionarios Registrados"
                value={formData.numFuncionariosRegistrados || ''}
                onChange={(e) => handleChange('numFuncionariosRegistrados', e.target.value)}
              />
              <TextField
                fullWidth
                label="Idade de cada funcionário"
                placeholder="Ex: 28, 35, 42"
                value={formData.idadeFuncionariosRegistrados || ''}
                onChange={(e) => handleChange('idadeFuncionariosRegistrados', e.target.value)}
              />
            </Box>

            {/* Espacos de Conveniencia - Multi-select chips */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Espacos de Conveniencia</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {ESPACOS_CONVENIENCIA_OPTIONS.map((option) => {
                  const selected = (formData.espacosConveniencia || []).includes(option)
                  return (
                    <Chip
                      key={option}
                      label={option}
                      onClick={() => {
                        const current = formData.espacosConveniencia || []
                        const updated = selected
                          ? current.filter((v: string) => v !== option)
                          : [...current, option]
                        handleChange('espacosConveniencia', updated)
                      }}
                      color={selected ? 'primary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  )
                })}
              </Box>
              {(formData.espacosConveniencia || []).includes('Outros') && (
                <TextField
                  fullWidth
                  size="small"
                  label="Especifique outros espacos"
                  value={formData.espacosConvenienciaOutros || ''}
                  onChange={(e) => handleChange('espacosConvenienciaOutros', e.target.value)}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>

            {/* Sistema de Protecao contra Incendio - Multi-select chips */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Sistema de Protecao contra Incendio</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {SISTEMA_PROTECAO_INCENDIO_OPTIONS.map((option) => {
                  const selected = (formData.sistemaProtecaoIncendio || []).includes(option)
                  return (
                    <Chip
                      key={option}
                      label={option}
                      onClick={() => {
                        const current = formData.sistemaProtecaoIncendio || []
                        const updated = selected
                          ? current.filter((v: string) => v !== option)
                          : [...current, option]
                        handleChange('sistemaProtecaoIncendio', updated)
                      }}
                      color={selected ? 'primary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  )
                })}
              </Box>
              {(formData.sistemaProtecaoIncendio || []).includes('Outros') && (
                <TextField
                  fullWidth
                  size="small"
                  label="Especifique outros sistemas"
                  value={formData.sistemaProtecaoIncendioOutros || ''}
                  onChange={(e) => handleChange('sistemaProtecaoIncendioOutros', e.target.value)}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          </Box>
        )

      case 3:
        return (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            <TextField
              fullWidth
              required
              label="Nome do Síndico"
              value={formData.sindicoNome || ''}
              onChange={(e) => handleChange('sindicoNome', e.target.value)}
              error={!!validationErrors.sindicoNome}
              helperText={validationErrors.sindicoNome}
            />
            <TextField
              fullWidth
              required
              type="email"
              label="E-mail"
              value={formData.sindicoEmail || ''}
              onChange={(e) => handleChange('sindicoEmail', e.target.value)}
              error={!!validationErrors.sindicoEmail}
              helperText={validationErrors.sindicoEmail}
            />
            <TextField
              fullWidth
              required
              label="Telefone"
              value={formData.sindicoTelefone || ''}
              onChange={(e) => handleChange('sindicoTelefone', e.target.value)}
              error={!!validationErrors.sindicoTelefone}
              helperText={validationErrors.sindicoTelefone}
            />
          </Box>
        )

      case 4:
        return (
          <>
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Bônus / Anos sem sinistro"
                value={formData.bonusAnosSemSinistro || ''}
                onChange={(e) => handleChange('bonusAnosSemSinistro', e.target.value)}
                placeholder="Ex: 5"
              />
              <TextField
                fullWidth
                type="number"
                label="Quantidade de sinistros"
                value={formData.quantidadeSinistros || ''}
                onChange={(e) => handleChange('quantidadeSinistros', e.target.value)}
                placeholder="Ex: 0"
              />
            </Box>
          </>
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
