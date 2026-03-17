package com.condocompare.documentos.dto;

import java.util.List;

public record ComparacaoResultadoDTO(
    List<OrcamentoComparacaoDTO> orcamentos,
    ComparacaoResumoDTO resumo
) {}
