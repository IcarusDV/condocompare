'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Skeleton,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SecurityIcon from '@mui/icons-material/Security'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ShieldIcon from '@mui/icons-material/Shield'
import PersonIcon from '@mui/icons-material/Person'
import EditIcon from '@mui/icons-material/Edit'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import BusinessIcon from '@mui/icons-material/Business'
import { apoliceService, getStatusApoliceLabel, getStatusApoliceColor } from '@/services/apoliceService'
import { ApoliceResponse, CoberturaResponse } from '@/types'

function formatCurrency(value: number | undefined | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: string | undefined | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

function getDiasRestantes(dataFim: string | undefined | null): number | null {
  if (!dataFim) return null
  const fim = new Date(dataFim)
  const hoje = new Date()
  const diff = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

interface InfoRowProps {
  label: string
  value: React.ReactNode
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value || '-'}
      </Typography>
    </Box>
  )
}

export default function ApoliceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [apolice, setApolice] = useState<ApoliceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await apoliceService.getById(id)
        setApolice(data)
      } catch (err) {
        console.error('Error loading apolice:', err)
        setError('Erro ao carregar apolice. Verifique se ela existe.')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={300} />
      </Box>
    )
  }

  if (error || !apolice) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard/seguros')} sx={{ mb: 2 }}>
          Voltar
        </Button>
        <Alert severity="error">{error || 'Apolice nao encontrada'}</Alert>
      </Box>
    )
  }

  const diasRestantes = getDiasRestantes(apolice.dataFim)
  const statusColor = getStatusApoliceColor(apolice.status)

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/dashboard/seguros')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SecurityIcon sx={{ color: '#3b82f6', fontSize: 28 }} />
              <Typography variant="h5" fontWeight="bold">
                {apolice.numeroApolice || 'Apolice sem numero'}
              </Typography>
              <Chip
                label={getStatusApoliceLabel(apolice.status)}
                color={statusColor}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 5.5 }}>
              {apolice.condominioNome || 'Condominio'} &bull; {apolice.seguradoraNome || 'Seguradora'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Renovar">
            <Button variant="outlined" startIcon={<AutorenewIcon />} size="small" onClick={async () => {
              try {
                await apoliceService.renovar(id)
                const data = await apoliceService.getById(id)
                setApolice(data)
              } catch { /* ignore */ }
            }}>
              Renovar
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Vigencia Alert */}
      {diasRestantes !== null && diasRestantes <= 30 && diasRestantes > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Esta apolice vence em <strong>{diasRestantes} dias</strong> ({formatDate(apolice.dataFim)}).
          Considere iniciar o processo de renovacao.
        </Alert>
      )}
      {diasRestantes !== null && diasRestantes <= 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Esta apolice esta <strong>vencida</strong> desde {formatDate(apolice.dataFim)}.
          Renovacao urgente necessaria.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Info */}
        <Grid item xs={12} md={7}>
          {/* Stats Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
              <AttachMoneyIcon sx={{ color: '#3b82f6', mb: 0.5 }} />
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(apolice.premioTotal)}
              </Typography>
              <Typography variant="caption" color="text.secondary">Premio Total</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
              <ShieldIcon sx={{ color: '#16a34a', mb: 0.5 }} />
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(apolice.importanciaSeguradaTotal)}
              </Typography>
              <Typography variant="caption" color="text.secondary">Importancia Segurada</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
              <SecurityIcon sx={{ color: '#7c3aed', mb: 0.5 }} />
              <Typography variant="h6" fontWeight="bold">
                {apolice.coberturas?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">Coberturas</Typography>
            </Paper>
          </Box>

          {/* Coberturas Table */}
          <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Coberturas ({apolice.coberturas?.length || 0})
              </Typography>
            </Box>
            {apolice.coberturas && apolice.coberturas.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                        Cobertura
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                        Limite
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                        Franquia
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                        Detalhes
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {apolice.coberturas.map((cob: CoberturaResponse) => (
                      <TableRow key={cob.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {cob.descricao}
                          </Typography>
                          {cob.tipo && (
                            <Typography variant="caption" color="text.secondary">
                              {cob.tipo}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(cob.limiteMaximo)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {cob.franquia ? formatCurrency(cob.franquia) : '-'}
                            {cob.franquiaPercentual ? ` (${cob.franquiaPercentual}%)` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {cob.carenciaDias ? (
                            <Chip label={`${cob.carenciaDias}d carencia`} size="small" variant="outlined" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <ShieldIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Nenhuma cobertura registrada</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Details */}
        <Grid item xs={12} md={5}>
          {/* Dados da Apolice */}
          <Paper sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Dados da Apolice
            </Typography>
            <InfoRow label="Numero" value={apolice.numeroApolice} />
            <InfoRow label="Status" value={
              <Chip label={getStatusApoliceLabel(apolice.status)} color={statusColor} size="small" />
            } />
            <InfoRow label="Vigencia" value={`${formatDate(apolice.dataInicio)} a ${formatDate(apolice.dataFim)}`} />
            {diasRestantes !== null && diasRestantes > 0 && (
              <InfoRow label="Dias restantes" value={
                <Chip label={`${diasRestantes} dias`} size="small" color={diasRestantes <= 30 ? 'warning' : 'default'} variant="outlined" />
              } />
            )}
            <InfoRow label="Forma Pagamento" value={apolice.formaPagamento} />
            {apolice.numeroParcelas && (
              <InfoRow label="Parcelas" value={`${apolice.numeroParcelas}x de ${formatCurrency(apolice.valorParcela)}`} />
            )}
          </Paper>

          {/* Valores */}
          <Paper sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Valores
            </Typography>
            <InfoRow label="Premio Total" value={formatCurrency(apolice.premioTotal)} />
            <InfoRow label="Premio Liquido" value={formatCurrency(apolice.premioLiquido)} />
            <InfoRow label="IOF" value={formatCurrency(apolice.iof)} />
            <InfoRow label="IS Total" value={formatCurrency(apolice.importanciaSeguradaTotal)} />
          </Paper>

          {/* Condominio e Seguradora */}
          <Paper sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Condominio & Seguradora
            </Typography>
            <InfoRow label="Condominio" value={
              <Button size="small" sx={{ textTransform: 'none', p: 0 }}
                onClick={() => router.push(`/dashboard/condominios/${apolice.condominioId}`)}>
                {apolice.condominioNome || apolice.condominioId}
              </Button>
            } />
            <InfoRow label="Seguradora" value={
              apolice.seguradoraId ? (
                <Button size="small" sx={{ textTransform: 'none', p: 0 }}
                  onClick={() => router.push(`/dashboard/seguradoras/${apolice.seguradoraId}`)}>
                  {apolice.seguradoraNome || apolice.seguradoraId}
                </Button>
              ) : (apolice.seguradoraNome || '-')
            } />
          </Paper>

          {/* Corretor */}
          {(apolice.corretorNome || apolice.corretorSusep) && (
            <Paper sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Corretor
              </Typography>
              <InfoRow label="Nome" value={apolice.corretorNome} />
              {apolice.corretorSusep && <InfoRow label="SUSEP" value={apolice.corretorSusep} />}
              {apolice.corretorTelefone && <InfoRow label="Telefone" value={apolice.corretorTelefone} />}
              {apolice.corretorEmail && <InfoRow label="Email" value={apolice.corretorEmail} />}
            </Paper>
          )}

          {/* Observacoes */}
          {(apolice.observacoes || apolice.clausulasEspeciais) && (
            <Paper sx={{ p: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Observacoes
              </Typography>
              {apolice.observacoes && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                  {apolice.observacoes}
                </Typography>
              )}
              {apolice.clausulasEspeciais && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    Clausulas Especiais
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {apolice.clausulasEspeciais}
                  </Typography>
                </>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
