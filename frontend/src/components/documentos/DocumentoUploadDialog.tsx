'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Paper,
  Autocomplete,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import DescriptionIcon from '@mui/icons-material/Description'
import DeleteIcon from '@mui/icons-material/Delete'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { documentoService, formatFileSize } from '@/services/documentoService'
import { condominioService } from '@/services/condominioService'
import { seguradoraService } from '@/services/seguradoraService'
import { TipoDocumento, CondominioListResponse, SeguradoraResponse } from '@/types'

interface DocumentoUploadDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  condominioId?: string
}

interface FileEntry {
  file: File
  nome: string
  status: 'pending' | 'uploading' | 'extracting' | 'done' | 'error'
  error?: string
  extractedCount?: number
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_FILES = 10

const getFileIcon = (mimeType: string) => {
  if (mimeType === 'application/pdf') return <PictureAsPdfIcon sx={{ color: '#ef4444' }} />
  if (mimeType.startsWith('image/')) return <ImageIcon sx={{ color: '#3b82f6' }} />
  if (mimeType.includes('word')) return <DescriptionIcon sx={{ color: '#2563eb' }} />
  return <InsertDriveFileIcon sx={{ color: '#6b7280' }} />
}

export function DocumentoUploadDialog({
  open,
  onClose,
  onSuccess,
  condominioId: initialCondominioId,
}: DocumentoUploadDialogProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [tipo, setTipo] = useState<TipoDocumento>('ORCAMENTO')
  const [observacoes, setObservacoes] = useState('')
  const [seguradoraNome, setSeguradoraNome] = useState('')
  const [condominioId, setCondominioId] = useState(initialCondominioId || '')
  const [condominios, setCondominios] = useState<CondominioListResponse[]>([])
  const [seguradoras, setSeguradoras] = useState<SeguradoraResponse[]>([])
  const [loadingCondominios, setLoadingCondominios] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoExtract, setAutoExtract] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)

  useEffect(() => {
    if (open && !initialCondominioId) {
      loadCondominios()
    }
    if (open) {
      loadSeguradoras()
    }
  }, [open, initialCondominioId])

  useEffect(() => {
    if (initialCondominioId) {
      setCondominioId(initialCondominioId)
    }
  }, [initialCondominioId])

  const loadSeguradoras = async () => {
    try {
      const response = await seguradoraService.list()
      setSeguradoras(response)
    } catch (err) {
      console.error('Error loading seguradoras:', err)
    }
  }

  const loadCondominios = async () => {
    try {
      setLoadingCondominios(true)
      const response = await condominioService.list({}, { size: 100 })
      setCondominios(response.content)
    } catch (err) {
      console.error('Error loading condominios:', err)
    } finally {
      setLoadingCondominios(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Tipo não permitido`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: Excede 50MB`
    }
    return null
  }

  const addFiles = (newFiles: File[]) => {
    setError(null)
    const errors: string[] = []
    const validFiles: FileEntry[] = []

    const currentNames = files.map(f => f.file.name)

    for (const file of newFiles) {
      if (files.length + validFiles.length >= MAX_FILES) {
        errors.push(`Máximo de ${MAX_FILES} arquivos por vez`)
        break
      }
      if (currentNames.includes(file.name)) {
        errors.push(`${file.name}: Já adicionado`)
        continue
      }
      const validationError = validateFile(file)
      if (validationError) {
        errors.push(validationError)
        continue
      }
      validFiles.push({
        file,
        nome: file.name.replace(/\.[^/.]+$/, ''),
        status: 'pending',
      })
      currentNames.push(file.name)
    }

    if (errors.length > 0) {
      setError(errors.join('. '))
    }
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files))
    }
  }, [files])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const updateFileName = (index: number, nome: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, nome } : f))
  }

  const handleUpload = async () => {
    if (files.length === 0 || !condominioId) {
      setError('Adicione arquivos e selecione o condomínio')
      return
    }

    const emptyNames = files.some(f => !f.nome.trim())
    if (emptyNames) {
      setError('Todos os arquivos precisam de um nome')
      return
    }

    try {
      setUploading(true)
      setError(null)
      setUploadComplete(false)

      for (let i = 0; i < files.length; i++) {
        setCurrentIndex(i)
        const entry = files[i]

        // Update status to uploading
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))

        try {
          // 1. Upload the document
          const uploadedDoc = await documentoService.upload({
            file: entry.file,
            condominioId,
            tipo,
            nome: entry.nome,
            observacoes: observacoes || undefined,
            seguradoraNome: seguradoraNome || undefined,
          })

          // Backend will handle extraction asynchronously via RabbitMQ
          setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f))
        } catch (err) {
          console.error(`Error uploading ${entry.file.name}:`, err)
          setFiles(prev =>
            prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: 'Erro no upload' } : f)
          )
        }
      }

      setUploadComplete(true)
    } finally {
      setUploading(false)
    }
  }

  const handleFinish = () => {
    resetForm()
    onSuccess()
  }

  const resetForm = () => {
    setFiles([])
    setTipo('ORCAMENTO')
    setObservacoes('')
    setSeguradoraNome('')
    if (!initialCondominioId) {
      setCondominioId('')
    }
    setError(null)
    setUploadComplete(false)
    setCurrentIndex(0)
  }

  const handleClose = () => {
    if (!uploading) {
      resetForm()
      onClose()
    }
  }

  const selectedCondominio = condominios.find(c => c.id === condominioId)
  const doneCount = files.filter(f => f.status === 'done').length
  const errorCount = files.filter(f => f.status === 'error').length
  const hasPdfs = files.some(f => f.file.type === 'application/pdf')
  const showExtractOption = (tipo === 'ORCAMENTO' || tipo === 'APOLICE') && hasPdfs

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            Upload de Documentos
          </Typography>
          {files.length > 0 && (
            <Chip
              label={`${files.length} arquivo${files.length > 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        <IconButton onClick={handleClose} disabled={uploading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {uploadComplete && (
          <Alert
            severity={errorCount > 0 ? 'warning' : 'success'}
            sx={{ mb: 2 }}
          >
            {errorCount > 0
              ? `${doneCount} de ${files.length} enviados com sucesso. ${errorCount} com erro.`
              : `${doneCount} documento${doneCount > 1 ? 's' : ''} enviado${doneCount > 1 ? 's' : ''} com sucesso!`}
          </Alert>
        )}

        {/* Drop Zone */}
        {!uploadComplete && (
          <Paper
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 3,
              mb: files.length > 0 ? 2 : 3,
              textAlign: 'center',
              bgcolor: dragActive ? 'primary.50' : 'grey.50',
              cursor: uploading ? 'default' : 'pointer',
              transition: 'all 0.2s',
              '&:hover': uploading ? {} : {
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
              },
            }}
            onClick={() => !uploading && document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              hidden
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Arraste e solte arquivos aqui ou clique para selecionar
            </Typography>
            <Typography variant="caption" color="text.secondary">
              PDF, JPEG, PNG, WEBP, DOC, DOCX (max 50MB cada, até {MAX_FILES} arquivos)
            </Typography>
          </Paper>
        )}

        {/* File List */}
        {files.length > 0 && (
          <List dense sx={{ mb: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            {files.map((entry, index) => (
              <ListItem
                key={index}
                sx={{
                  borderBottom: index < files.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  py: 1,
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {entry.status === 'done' ? (
                    <CheckCircleIcon sx={{ color: '#22c55e' }} />
                  ) : entry.status === 'error' ? (
                    <ErrorIcon sx={{ color: '#ef4444' }} />
                  ) : entry.status === 'uploading' || entry.status === 'extracting' ? (
                    <Box sx={{ width: 24, height: 24, position: 'relative' }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: '3px solid',
                          borderColor: entry.status === 'extracting' ? '#a855f7' : '#6366f1',
                          borderTopColor: 'transparent',
                          animation: 'spin 1s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    getFileIcon(entry.file.type)
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    !uploading && !uploadComplete ? (
                      <TextField
                        value={entry.nome}
                        onChange={(e) => updateFileName(index, e.target.value)}
                        size="small"
                        variant="standard"
                        fullWidth
                        sx={{ '& input': { fontSize: '0.875rem', py: 0 } }}
                      />
                    ) : (
                      <Typography variant="body2" fontWeight={500}>
                        {entry.nome}
                      </Typography>
                    )
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(entry.file.size)}
                      </Typography>
                      {entry.status === 'uploading' && (
                        <Typography variant="caption" color="primary.main">Enviando...</Typography>
                      )}
                      {entry.status === 'extracting' && (
                        <Typography variant="caption" sx={{ color: '#a855f7' }}>Extraindo dados...</Typography>
                      )}
                      {entry.status === 'done' && entry.extractedCount !== undefined && entry.extractedCount > 0 && (
                        <Typography variant="caption" sx={{ color: '#22c55e' }}>
                          {entry.extractedCount} coberturas extraídas
                        </Typography>
                      )}
                      {entry.status === 'error' && (
                        <Typography variant="caption" color="error">{entry.error}</Typography>
                      )}
                    </Box>
                  }
                />
                {!uploading && !uploadComplete && (
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" onClick={() => removeFile(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        )}

        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Processando arquivo {currentIndex + 1} de {files.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(((currentIndex) / files.length) * 100)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(currentIndex / files.length) * 100}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        )}

        {/* Form Fields */}
        {!uploadComplete && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!initialCondominioId && (
              <Autocomplete
                options={condominios}
                getOptionLabel={(option) => option.nome}
                value={selectedCondominio || null}
                onChange={(_, newValue) => setCondominioId(newValue?.id || '')}
                loading={loadingCondominios}
                disabled={uploading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Condomínio *"
                    size="small"
                    placeholder="Selecione o condomínio"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2">{option.nome}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.cidade}/{option.estado}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            )}

            <FormControl fullWidth size="small" disabled={uploading}>
              <InputLabel>Tipo de Documento *</InputLabel>
              <Select
                value={tipo}
                label="Tipo de Documento *"
                onChange={(e) => setTipo(e.target.value as TipoDocumento)}
              >
                <MenuItem value="APOLICE">Apólice</MenuItem>
                <MenuItem value="ORCAMENTO">Orçamento</MenuItem>
                <MenuItem value="CONDICOES_GERAIS">Condições Gerais</MenuItem>
                <MenuItem value="LAUDO_VISTORIA">Laudo de Vistoria</MenuItem>
                <MenuItem value="SINISTRO">Sinistro</MenuItem>
                <MenuItem value="OUTRO">Outro</MenuItem>
              </Select>
            </FormControl>

            <Autocomplete
              options={seguradoras}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.nome}
              freeSolo
              value={seguradoras.find(s => s.nome === seguradoraNome) || null}
              inputValue={seguradoraNome}
              onInputChange={(_, newValue) => setSeguradoraNome(newValue)}
              onChange={(_, newValue) => {
                if (typeof newValue === 'string') {
                  setSeguradoraNome(newValue)
                } else if (newValue) {
                  setSeguradoraNome(newValue.nome)
                } else {
                  setSeguradoraNome('')
                }
              }}
              disabled={uploading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seguradora"
                  size="small"
                  placeholder="Selecione ou digite a seguradora"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Typography variant="body2">{option.nome}</Typography>
                </li>
              )}
            />

            {(tipo === 'ORCAMENTO' || tipo === 'APOLICE') && (
              <>
                {showExtractOption && (
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: autoExtract ? '#f0fdf4' : '#f8fafc',
                      border: '1px solid',
                      borderColor: autoExtract ? '#22c55e' : '#e2e8f0',
                      borderRadius: 2,
                      cursor: uploading ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => !uploading && setAutoExtract(!autoExtract)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: autoExtract ? '#22c55e' : '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <AutoAwesomeIcon sx={{ fontSize: 20, color: autoExtract ? 'white' : '#94a3b8' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} color={autoExtract ? '#166534' : 'text.primary'}>
                          Extrair coberturas automaticamente
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          O sistema vai identificar e preencher as coberturas dos PDFs automaticamente
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 40,
                          height: 22,
                          borderRadius: 11,
                          bgcolor: autoExtract ? '#22c55e' : '#d1d5db',
                          position: 'relative',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            bgcolor: 'white',
                            position: 'absolute',
                            top: 2,
                            left: autoExtract ? 20 : 2,
                            transition: 'all 0.2s',
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                )}
              </>
            )}

            <TextField
              label="Observações"
              size="small"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              multiline
              rows={2}
              placeholder="Informações adicionais sobre os documentos..."
              disabled={uploading}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {uploadComplete ? (
          <Button
            variant="contained"
            onClick={handleFinish}
            sx={{ bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' } }}
            startIcon={<CheckCircleIcon />}
          >
            Concluir
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={files.length === 0 || !condominioId || uploading}
              startIcon={
                showExtractOption && autoExtract
                  ? <AutoAwesomeIcon />
                  : files.length > 1
                    ? undefined
                    : undefined
              }
              sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
            >
              {uploading
                ? `Enviando ${currentIndex + 1}/${files.length}...`
                : files.length > 1
                  ? `Enviar ${files.length} Arquivos`
                  : showExtractOption && autoExtract
                    ? 'Enviar e Extrair'
                    : 'Enviar'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
