'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Skeleton,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import HandymanIcon from '@mui/icons-material/Handyman'
import { parceiroService } from '@/services/parceiroService'
import {
  UpdateParceiroRequest,
  CategoriaParceiro,
  CATEGORIAS_PARCEIRO,
} from '@/types'

const ESTADOS = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapa' }, { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceara' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espirito Santo' },
  { sigla: 'GO', nome: 'Goias' }, { sigla: 'MA', nome: 'Maranhao' },
  { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Para' },
  { sigla: 'PB', nome: 'Paraiba' }, { sigla: 'PR', nome: 'Parana' },
  { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piaui' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondonia' },
  { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'Sao Paulo' }, { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
]

export default function EditarParceiroPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<UpdateParceiroRequest>({
    nome: '',
    categorias: [],
  })

  const loadParceiro = useCallback(async () => {
    try {
      setLoading(true)
      const data = await parceiroService.getById(id)
      setFormData({
        nome: data.nome,
        nomeFantasia: data.nomeFantasia || '',
        cnpj: data.cnpj || '',
        cpf: data.cpf || '',
        email: data.email || '',
        telefone: data.telefone || '',
        celular: data.celular || '',
        website: data.website || '',
        endereco: data.endereco?.endereco || '',
        numero: data.endereco?.numero || '',
        complemento: data.endereco?.complemento || '',
        bairro: data.endereco?.bairro || '',
        cidade: data.endereco?.cidade || '',
        estado: data.endereco?.estado || '',
        cep: data.endereco?.cep || '',
        categorias: data.categorias || [],
        descricaoServicos: data.descricaoServicos || '',
        areaAtuacao: data.areaAtuacao || '',
        contatoNome: data.contatoNome || '',
        contatoCargo: data.contatoCargo || '',
        observacoes: data.observacoes || '',
      })
    } catch (err) {
      console.error('Error loading parceiro:', err)
      setError('Erro ao carregar parceiro')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadParceiro()
  }, [loadParceiro])

  const handleChange = (field: keyof UpdateParceiroRequest, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome?.trim()) {
      setError('Nome e obrigatorio')
      return
    }

    if (!formData.categorias || formData.categorias.length === 0) {
      setError('Selecione pelo menos uma categoria')
      return
    }

    try {
      setSaving(true)
      setError(null)
      await parceiroService.update(id, formData)
      router.push(`/dashboard/parceiros/${id}`)
    } catch (err) {
      console.error('Error updating parceiro:', err)
      setError('Erro ao atualizar parceiro. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Skeleton variant="rounded" width={80} height={36} />
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="rounded" height={150} sx={{ mb: 2 }} />
        ))}
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/dashboard/parceiros/${id}`)}>
          Voltar
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">Editar Parceiro</Typography>
          <Typography variant="body2" color="text.secondary">
            {formData.nomeFantasia || formData.nome}
          </Typography>
        </Box>
        <Button type="submit" variant="contained"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={saving}
          sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* Dados Basicos */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <HandymanIcon sx={{ color: '#6366f1' }} />
          <Typography variant="h6" fontWeight="600">Dados do Parceiro</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Razao Social / Nome *"
              value={formData.nome || ''} onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Nome da empresa ou profissional" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Nome Fantasia"
              value={formData.nomeFantasia || ''} onChange={(e) => handleChange('nomeFantasia', e.target.value)}
              placeholder="Nome comercial" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="CNPJ"
              value={formData.cnpj || ''} onChange={(e) => handleChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="CPF"
              value={formData.cpf || ''} onChange={(e) => handleChange('cpf', e.target.value)}
              placeholder="000.000.000-00" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Website"
              value={formData.website || ''} onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://..." />
          </Grid>
        </Grid>
      </Paper>

      {/* Categorias */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Categorias de Servico *</Typography>
        <FormControl fullWidth>
          <InputLabel>Categorias</InputLabel>
          <Select multiple value={formData.categorias || []}
            onChange={(e) => handleChange('categorias', e.target.value)}
            input={<OutlinedInput label="Categorias" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as CategoriaParceiro[]).map((cat) => (
                  <Chip key={cat} label={CATEGORIAS_PARCEIRO[cat]} size="small" />
                ))}
              </Box>
            )}>
            {Object.entries(CATEGORIAS_PARCEIRO).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                <Checkbox checked={(formData.categorias || []).includes(key as CategoriaParceiro)} />
                <ListItemText primary={label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField fullWidth multiline rows={3} label="Descricao dos Servicos"
          value={formData.descricaoServicos || ''} onChange={(e) => handleChange('descricaoServicos', e.target.value)}
          placeholder="Descreva os servicos oferecidos..." sx={{ mt: 2 }} />
        <TextField fullWidth label="Area de Atuacao"
          value={formData.areaAtuacao || ''} onChange={(e) => handleChange('areaAtuacao', e.target.value)}
          placeholder="Ex: Grande Sao Paulo, Interior de SP, etc." sx={{ mt: 2 }} />
      </Paper>

      {/* Contato */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Contato</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Email" type="email"
              value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@exemplo.com" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Telefone"
              value={formData.telefone || ''} onChange={(e) => handleChange('telefone', e.target.value)}
              placeholder="(11) 3000-0000" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Celular / WhatsApp"
              value={formData.celular || ''} onChange={(e) => handleChange('celular', e.target.value)}
              placeholder="(11) 99000-0000" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Nome do Contato"
              value={formData.contatoNome || ''} onChange={(e) => handleChange('contatoNome', e.target.value)}
              placeholder="Pessoa responsavel" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Cargo"
              value={formData.contatoCargo || ''} onChange={(e) => handleChange('contatoCargo', e.target.value)}
              placeholder="Ex: Gerente Comercial" />
          </Grid>
        </Grid>
      </Paper>

      {/* Endereco */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Endereco</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField fullWidth label="Endereco"
              value={formData.endereco || ''} onChange={(e) => handleChange('endereco', e.target.value)}
              placeholder="Rua, Avenida..." />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Numero"
              value={formData.numero || ''} onChange={(e) => handleChange('numero', e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Complemento"
              value={formData.complemento || ''} onChange={(e) => handleChange('complemento', e.target.value)}
              placeholder="Sala, Conjunto..." />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Bairro"
              value={formData.bairro || ''} onChange={(e) => handleChange('bairro', e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="CEP"
              value={formData.cep || ''} onChange={(e) => handleChange('cep', e.target.value)}
              placeholder="00000-000" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Cidade"
              value={formData.cidade || ''} onChange={(e) => handleChange('cidade', e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={formData.estado || ''} label="Estado"
                onChange={(e) => handleChange('estado', e.target.value)}>
                <MenuItem value="">Selecione...</MenuItem>
                {ESTADOS.map((estado) => (
                  <MenuItem key={estado.sigla} value={estado.sigla}>{estado.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Observacoes */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField fullWidth multiline rows={3} label="Observacoes"
          value={formData.observacoes || ''} onChange={(e) => handleChange('observacoes', e.target.value)}
          placeholder="Informacoes adicionais..." />
      </Paper>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={() => router.push(`/dashboard/parceiros/${id}`)}>Cancelar</Button>
        <Button type="submit" variant="contained"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={saving}
          sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
          {saving ? 'Salvando...' : 'Salvar Alteracoes'}
        </Button>
      </Box>
    </Box>
  )
}
