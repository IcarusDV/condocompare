'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  Tooltip,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { OrcamentoComparacaoDTO, CoberturaDTO } from '@/types'

interface ComparacaoCoberturasProps {
  orcamentos: OrcamentoComparacaoDTO[]
  coberturasComuns: string[]
}

const formatCurrency = (value?: number) => {
  if (!value) return '-'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ComparacaoCoberturas({
  orcamentos,
  coberturasComuns,
}: ComparacaoCoberturasProps) {
  // Collect all unique coverage names
  const todasCoberturas = new Set<string>()
  orcamentos.forEach((orc) => {
    orc.coberturas.forEach((cob) => {
      if (cob.incluido) todasCoberturas.add(cob.nome)
    })
  })

  const coberturasArray = Array.from(todasCoberturas).sort()

  // Get coverage info for each orcamento
  const getCoberturaInfo = (
    orcamento: OrcamentoComparacaoDTO,
    nomeCobertura: string
  ): CoberturaDTO | null => {
    return (
      orcamento.coberturas.find(
        (c) => c.nome === nomeCobertura && c.incluido
      ) || null
    )
  }

  // Find best values for highlighting
  const getMelhoresValores = (nomeCobertura: string) => {
    let maiorLimite = 0
    let menorFranquia = Infinity

    orcamentos.forEach((orc) => {
      const cob = getCoberturaInfo(orc, nomeCobertura)
      if (cob) {
        if (cob.valorLimite && cob.valorLimite > maiorLimite) {
          maiorLimite = cob.valorLimite
        }
        if (cob.franquia && cob.franquia < menorFranquia) {
          menorFranquia = cob.franquia
        }
      }
    })

    return { maiorLimite, menorFranquia }
  }

  if (coberturasArray.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Nenhuma cobertura cadastrada nos orcamentos selecionados.
        </Typography>
      </Paper>
    )
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>
              Cobertura
            </TableCell>
            {orcamentos.map((orc) => (
              <TableCell
                key={orc.id}
                align="center"
                sx={{ fontWeight: 'bold' }}
              >
                {orc.seguradoraNome}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {coberturasArray.map((nomeCobertura) => {
            const isComum = coberturasComuns.includes(nomeCobertura)
            const melhores = getMelhoresValores(nomeCobertura)

            return (
              <TableRow
                key={nomeCobertura}
                sx={{ '&:hover': { bgcolor: 'grey.50' } }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{nomeCobertura}</Typography>
                    {isComum && (
                      <Tooltip title="Cobertura presente em todos os orcamentos">
                        <Chip
                          label="Comum"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                {orcamentos.map((orc) => {
                  const cob = getCoberturaInfo(orc, nomeCobertura)
                  if (!cob) {
                    return (
                      <TableCell key={orc.id} align="center">
                        <CancelIcon
                          fontSize="small"
                          sx={{ color: 'error.light' }}
                        />
                      </TableCell>
                    )
                  }

                  const isMelhorLimite =
                    cob.valorLimite === melhores.maiorLimite &&
                    melhores.maiorLimite > 0
                  const isMelhorFranquia =
                    cob.franquia === melhores.menorFranquia &&
                    melhores.menorFranquia < Infinity

                  return (
                    <TableCell key={orc.id} align="center">
                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                          }}
                        >
                          <CheckCircleIcon
                            fontSize="small"
                            sx={{ color: 'success.main' }}
                          />
                        </Box>
                        {cob.valorLimite && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: isMelhorLimite ? 'bold' : 'normal',
                              color: isMelhorLimite
                                ? 'success.main'
                                : 'text.secondary',
                            }}
                          >
                            Limite: {formatCurrency(cob.valorLimite)}
                          </Typography>
                        )}
                        {cob.franquia && (
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{
                              fontWeight: isMelhorFranquia ? 'bold' : 'normal',
                              color: isMelhorFranquia
                                ? 'success.main'
                                : 'text.secondary',
                            }}
                          >
                            Franquia: {formatCurrency(cob.franquia)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
