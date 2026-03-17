package com.condocompare.diagnostico.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record DiagnosticoCompletoDTO(
    UUID condominioId,
    String condominioNome,
    UUID apoliceId,
    String numeroApolice,
    String seguradoraNome,
    LocalDateTime dataAnalise,
    ScoreCoberturaDTO score,
    AnaliseRiscoDTO analiseRisco,
    List<RecomendacaoDTO> recomendacoes,
    List<CoberturaAnaliseDTO> coberturasAnalise,
    ResumoDTO resumo
) {}
