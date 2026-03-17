package com.condocompare.vistorias.dto;

import com.condocompare.vistorias.entity.StatusVistoria;
import com.condocompare.vistorias.entity.TipoVistoria;

import java.time.LocalDateTime;
import java.util.UUID;

public record VistoriaListResponse(
    UUID id,
    UUID condominioId,
    String condominioNome,
    TipoVistoria tipo,
    StatusVistoria status,
    LocalDateTime dataAgendada,
    LocalDateTime dataRealizada,
    String responsavelNome,
    Integer notaGeral,
    int totalPendencias,
    LocalDateTime createdAt
) {}
