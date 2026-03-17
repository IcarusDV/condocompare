'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Paper,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
  Alert,
  LinearProgress,
  Autocomplete,
  Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import SecurityIcon from '@mui/icons-material/Security'
import { documentoService } from '@/services/documentoService'
import { iaService } from '@/services/iaService'
import {
  DocumentoResponse,
  CoberturaDTO,
  UpdateOrcamentoDataRequest,
  COBERTURAS_PADRAO,
} from '@/types'

interface OrcamentoDataDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  documento: DocumentoResponse | null
}

interface FormData {
  seguradoraNome: string
  valorPremio: string
  dataVigenciaInicio: string
  dataVigenciaFim: string
  coberturas: CoberturaDTO[]
  condicoesEspeciais: string[]
  descontos: string
  formaPagamento: string
  observacoes: string
}

const initialFormData: FormData = {
  seguradoraNome: '',
  valorPremio: '',
  dataVigenciaInicio: '',
  dataVigenciaFim: '',
  coberturas: [],
  condicoesEspeciais: [],
  descontos: '',
  formaPagamento: '',
  observacoes: '',
}

export function OrcamentoDataDialog({
  open,
  onClose,
  onSuccess,
  documento,
}: OrcamentoDataDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newCobertura, setNewCobertura] = useState('')

  useEffect(() => {
    if (documento && open) {
      // Pre-fill form with existing data
      const dadosExtraidos = documento.dadosExtraidos as {
        coberturas?: CoberturaDTO[]
        condicoesEspeciais?: string[]
        descontos?: number
        formaPagamento?: string
      } | undefined

      setFormData({
        seguradoraNome: documento.seguradoraNome || '',
        valorPremio: documento.valorPremio?.toString() || '',
        dataVigenciaInicio: documento.dataVigenciaInicio || '',
        dataVigenciaFim: documento.dataVigenciaFim || '',
        coberturas: dadosExtraidos?.coberturas || [],
        condicoesEspeciais: dadosExtraidos?.condicoesEspeciais || [],
        descontos: dadosExtraidos?.descontos?.toString() || '',
        formaPagamento: dadosExtraidos?.formaPagamento || '',
        observacoes: documento.observacoes || '',
      })
    } else {
      setFormData(initialFormData)
    }
    setError(null)
  }, [documento, open])

  const handleAddCobertura = (nome: string) => {
    if (!nome.trim()) return
    const exists = formData.coberturas.some(
      (c) => c.nome.toLowerCase() === nome.toLowerCase()
    )
    if (exists) {
      setError('Esta cobertura ja foi adicionada')
      return
    }
    setFormData((prev) => ({
      ...prev,
      coberturas: [
        ...prev.coberturas,
        { nome: nome.trim(), valorLimite: undefined, franquia: undefined, incluido: true },
      ],
    }))
    setNewCobertura('')
    setError(null)
  }

  const handleAddAllCoberturasPadrao = () => {
    const novas = COBERTURAS_PADRAO
      .filter((nome) => !formData.coberturas.some((c) => c.nome.toLowerCase() === nome.toLowerCase()))
      .map((nome) => ({
        nome,
        valorLimite: undefined as number | undefined,
        franquia: undefined as number | undefined,
        incluido: true,
      }))
    if (novas.length === 0) {
      setError('Todas as coberturas padrao ja foram adicionadas')
      return
    }
    setFormData((prev) => ({
      ...prev,
      coberturas: [...prev.coberturas, ...novas],
    }))
    setError(null)
  }

  const handleRemoveCobertura = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      coberturas: prev.coberturas.filter((_, i) => i !== index),
    }))
  }

  const handleCoberturaChange = (
    index: number,
    field: keyof CoberturaDTO,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      coberturas: prev.coberturas.map((c, i) =>
        i === index
          ? {
              ...c,
              [field]:
                field === 'incluido'
                  ? value
                  : field === 'valorLimite' || field === 'franquia'
                  ? value ? parseFloat(value as string) : undefined
                  : value,
            }
          : c
      ),
    }))
  }

  const handleSave = async () => {
    if (!documento) return

    // Validation
    if (!formData.seguradoraNome.trim()) {
      setError('Nome da seguradora e obrigatorio')
      return
    }
    if (!formData.valorPremio || parseFloat(formData.valorPremio) <= 0) {
      setError('Valor do premio e obrigatorio')
      return
    }
    if (!formData.dataVigenciaInicio || !formData.dataVigenciaFim) {
      setError('Datas de vigencia sao obrigatorias')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const request: UpdateOrcamentoDataRequest = {
        seguradoraNome: formData.seguradoraNome.trim(),
        valorPremio: parseFloat(formData.valorPremio),
        dataVigenciaInicio: formData.dataVigenciaInicio,
        dataVigenciaFim: formData.dataVigenciaFim,
        dadosOrcamento: {
          coberturas: formData.coberturas,
          condicoesEspeciais: formData.condicoesEspeciais.filter((c) => c.trim()),
          descontos: formData.descontos ? parseFloat(formData.descontos) : undefined,
          formaPagamento: formData.formaPagamento || undefined,
        },
        observacoes: formData.observacoes || undefined,
      }

      await documentoService.updateOrcamentoData(documento.id, request)
      onSuccess()
    } catch (err) {
      console.error('Error saving orcamento data:', err)
      setError('Erro ao salvar dados do orcamento. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving && !extracting) {
      onClose()
    }
  }

  const handleExtractFromPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Apenas arquivos PDF sao suportados')
      return
    }

    try {
      setExtracting(true)
      setError(null)
      setSuccess(null)

      const result = await iaService.extractPdf(file, 'orcamento')

      if (result.dados_extraidos) {
        const dados = result.dados_extraidos

        setFormData((prev) => ({
          ...prev,
          seguradoraNome: dados.seguradoraNome || prev.seguradoraNome,
          valorPremio: dados.valorPremio?.toString() || prev.valorPremio,
          dataVigenciaInicio: dados.dataVigenciaInicio || prev.dataVigenciaInicio,
          dataVigenciaFim: dados.dataVigenciaFim || prev.dataVigenciaFim,
          formaPagamento: dados.formaPagamento || prev.formaPagamento,
          descontos: dados.descontos?.toString() || prev.descontos,
          coberturas: dados.coberturas?.length ? dados.coberturas : prev.coberturas,
        }))

        setSuccess('Dados extraidos com sucesso! Revise e ajuste se necessario.')
      }
    } catch (err) {
      console.error('Error extracting PDF:', err)
      setError('Erro ao extrair dados do PDF. Verifique se o servico de IA esta disponivel.')
    } finally {
      setExtracting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Preencher Dados do Orcamento
          </Typography>
          {documento && (
            <Typography variant="body2" color="text.secondary">
              {documento.nome}
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleClose} disabled={saving}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* AI Extraction */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)',
            border: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon sx={{ color: '#6366f1' }} />
              <Typography variant="subtitle2" fontWeight="bold">
                Extracao Automatica com IA
              </Typography>
              <Chip label="Beta" size="small" sx={{ bgcolor: '#6366f1', color: 'white', height: 20, fontSize: '0.7rem' }} />
            </Box>
            <Box>
              <input
                type="file"
                accept=".pdf"
                id="pdf-upload"
                style={{ display: 'none' }}
                onChange={handleExtractFromPdf}
                disabled={extracting}
              />
              <label htmlFor="pdf-upload">
                <Button
                  component="span"
                  variant="contained"
                  size="small"
                  startIcon={extracting ? undefined : <UploadFileIcon />}
                  disabled={extracting}
                  sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
                >
                  {extracting ? 'Extraindo...' : 'Enviar PDF'}
                </Button>
              </label>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Envie o PDF do orcamento para preencher automaticamente os campos
          </Typography>
          {extracting && <LinearProgress sx={{ mt: 1 }} />}
        </Paper>

        {/* Dados Basicos */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Dados Basicos
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Seguradora *"
                value={formData.seguradoraNome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, seguradoraNome: e.target.value }))
                }
                placeholder="Ex: Porto Seguro, Tokio Marine..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Valor do Premio (R$) *"
                type="number"
                value={formData.valorPremio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, valorPremio: e.target.value }))
                }
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Inicio da Vigencia *"
                type="date"
                value={formData.dataVigenciaInicio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dataVigenciaInicio: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Fim da Vigencia *"
                type="date"
                value={formData.dataVigenciaFim}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dataVigenciaFim: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Desconto (%)"
                type="number"
                value={formData.descontos}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descontos: e.target.value }))
                }
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Forma de Pagamento"
                value={formData.formaPagamento}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, formaPagamento: e.target.value }))
                }
                placeholder="Ex: 12x sem juros, a vista..."
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Coberturas */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Coberturas
              </Typography>
              {formData.coberturas.length > 0 && (
                <Chip
                  label={`${formData.coberturas.filter((c) => c.incluido).length}/${formData.coberturas.length} incluidas`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 22 }}
                />
              )}
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlaylistAddIcon />}
              onClick={handleAddAllCoberturasPadrao}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Adicionar Todas Padrao ({COBERTURAS_PADRAO.filter((c) => !formData.coberturas.some((fc) => fc.nome === c)).length})
            </Button>
          </Box>

          {/* Add Cobertura Individual */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Autocomplete
              freeSolo
              options={COBERTURAS_PADRAO.filter(
                (c) => !formData.coberturas.some((fc) => fc.nome === c)
              )}
              value={newCobertura}
              onChange={(_, value) => {
                if (value) handleAddCobertura(value)
              }}
              onInputChange={(_, value) => setNewCobertura(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Adicionar Cobertura Individual"
                  placeholder="Selecione ou digite..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCobertura(newCobertura)
                    }
                  }}
                />
              )}
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleAddCobertura(newCobertura)}
            >
              Adicionar
            </Button>
          </Box>

          {/* Coberturas List */}
          {formData.coberturas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
              <SecurityIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Nenhuma cobertura adicionada
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Clique em "Adicionar Todas Padrao" para preencher rapidamente
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PlaylistAddIcon />}
                onClick={handleAddAllCoberturasPadrao}
              >
                Adicionar {COBERTURAS_PADRAO.length} Coberturas Padrao
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {formData.coberturas.map((cobertura, index) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{ p: 1.5, bgcolor: cobertura.incluido ? 'white' : 'grey.100' }}
                >
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={cobertura.incluido}
                              onChange={(e) =>
                                handleCoberturaChange(index, 'incluido', e.target.checked)
                              }
                            />
                          }
                          label={
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: cobertura.incluido ? 'none' : 'line-through',
                              }}
                            >
                              {cobertura.nome}
                            </Typography>
                          }
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Valor Limite (R$)"
                        type="number"
                        value={cobertura.valorLimite || ''}
                        onChange={(e) =>
                          handleCoberturaChange(index, 'valorLimite', e.target.value)
                        }
                        inputProps={{ min: 0, step: 0.01 }}
                        disabled={!cobertura.incluido}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Franquia (R$)"
                        type="number"
                        value={cobertura.franquia || ''}
                        onChange={(e) =>
                          handleCoberturaChange(index, 'franquia', e.target.value)
                        }
                        inputProps={{ min: 0, step: 0.01 }}
                        disabled={!cobertura.incluido}
                      />
                    </Grid>
                    <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveCobertura(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>

        {/* Condicoes Especiais */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Condicoes Especiais
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Clausulas, restricoes ou condicoes particulares deste orcamento
          </Typography>
          {formData.condicoesEspeciais.map((cond, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={cond}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    condicoesEspeciais: prev.condicoesEspeciais.map((c, i) => (i === index ? e.target.value : c)),
                  }))
                }}
                placeholder="Ex: Franquia reduzida para sinistros ate R$ 5.000..."
              />
              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    condicoesEspeciais: prev.condicoesEspeciais.filter((_, i) => i !== index),
                  }))
                }
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                condicoesEspeciais: [...prev.condicoesEspeciais, ''],
              }))
            }
          >
            Adicionar Condicao
          </Button>
        </Paper>

        {/* Observacoes */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Observacoes
          </Typography>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            value={formData.observacoes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, observacoes: e.target.value }))
            }
            placeholder="Informacoes adicionais sobre o orcamento..."
          />
        </Paper>

        {saving && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          {saving ? 'Salvando...' : 'Salvar Dados'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
