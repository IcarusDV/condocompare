'use client'

import { Box, Paper, Typography, Grid, Divider, Chip } from '@mui/material'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PaymentIcon from '@mui/icons-material/Payment'
import DiscountIcon from '@mui/icons-material/Discount'
import { ComparacaoResultadoDTO, OrcamentoComparacaoDTO } from '@/types'
import { ComparacaoCoberturas } from './ComparacaoCoberturas'
import { RecomendacaoCard } from './RecomendacaoCard'

interface ComparacaoOrcamentosProps {
  resultado: ComparacaoResultadoDTO
}

const formatCurrency = (value?: number) => {
  if (!value) return '-'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

interface OrcamentoCardProps {
  orcamento: OrcamentoComparacaoDTO
  isMenorPreco: boolean
  isMaiorCobertura: boolean
}

function OrcamentoCard({
  orcamento,
  isMenorPreco,
  isMaiorCobertura,
}: OrcamentoCardProps) {
  return (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        border: isMenorPreco || isMaiorCobertura ? 2 : 1,
        borderColor:
          isMenorPreco && isMaiorCobertura
            ? 'warning.main'
            : isMenorPreco
            ? 'success.main'
            : isMaiorCobertura
            ? 'primary.main'
            : 'grey.200',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {orcamento.seguradoraNome}
          </Typography>
          {isMenorPreco && (
            <Chip label="Menor Preco" size="small" color="success" />
          )}
          {isMaiorCobertura && (
            <Chip label="Maior Cobertura" size="small" color="primary" />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {orcamento.nome}
        </Typography>
      </Box>

      {/* Valor */}
      <Box
        sx={{
          bgcolor: isMenorPreco ? 'success.50' : 'grey.50',
          p: 2,
          borderRadius: 1,
          mb: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Valor do Prêmio
        </Typography>
        <Typography
          variant="h4"
          fontWeight="bold"
          color={isMenorPreco ? 'success.main' : 'text.primary'}
        >
          {formatCurrency(orcamento.valorPremio)}
        </Typography>
      </Box>

      {/* Detalhes */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarTodayIcon fontSize="small" color="action" />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Vigência
            </Typography>
            <Typography variant="body2">
              {formatDate(orcamento.dataVigenciaInicio)} a{' '}
              {formatDate(orcamento.dataVigenciaFim)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({orcamento.vigenciaDias} dias)
            </Typography>
          </Box>
        </Box>

        {orcamento.formaPagamento && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Pagamento
              </Typography>
              <Typography variant="body2">
                {orcamento.formaPagamento}
              </Typography>
            </Box>
          </Box>
        )}

        {orcamento.descontos && orcamento.descontos > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DiscountIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Desconto
              </Typography>
              <Typography variant="body2" color="success.main">
                {orcamento.descontos}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* Coberturas count */}
        <Box
          sx={{
            mt: 1,
            pt: 1,
            borderTop: 1,
            borderColor: 'grey.200',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {orcamento.coberturas.filter((c) => c.incluido).length} coberturas
            incluidas
          </Typography>
        </Box>

        {/* Condicoes especiais */}
        {orcamento.condicoesEspeciais &&
          orcamento.condicoesEspeciais.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Condicoes Especiais:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {orcamento.condicoesEspeciais.map((cond, idx) => (
                  <Chip
                    key={idx}
                    label={cond}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24, fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}
      </Box>
    </Paper>
  )
}

export function ComparacaoOrcamentos({ resultado }: ComparacaoOrcamentosProps) {
  const { orcamentos, resumo } = resultado

  return (
    <Box>
      {/* Recomendacoes */}
      {resumo.recomendacoes && resumo.recomendacoes.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Recomendacoes
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {resumo.recomendacoes.map((rec, idx) => (
              <RecomendacaoCard key={idx} recomendacao={rec} />
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Cards lado a lado */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Comparacao de Valores
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {orcamentos.map((orc) => (
          <Grid item xs={12} md={12 / orcamentos.length} key={orc.id}>
            <OrcamentoCard
              orcamento={orc}
              isMenorPreco={resumo.menorPrecoId === orc.id}
              isMaiorCobertura={resumo.maiorCoberturaId === orc.id}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Tabela de Coberturas */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Comparacao de Coberturas
      </Typography>
      <ComparacaoCoberturas
        orcamentos={orcamentos}
        coberturasComuns={resumo.coberturasComuns || []}
      />

      {/* Coberturas exclusivas */}
      {resumo.coberturasExclusivas &&
        Object.keys(resumo.coberturasExclusivas).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Coberturas Exclusivas por Seguradora
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(resumo.coberturasExclusivas).map(
                ([seguradora, coberturas]) => (
                  <Grid item xs={12} md={6} key={seguradora}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        color="primary"
                      >
                        {seguradora}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          mt: 1,
                        }}
                      >
                        {coberturas.map((cob, idx) => (
                          <Chip
                            key={idx}
                            label={cob}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                )
              )}
            </Grid>
          </Box>
        )}
    </Box>
  )
}
