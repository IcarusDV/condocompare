package com.condocompare.vistorias.dto;

import com.condocompare.vistorias.entity.StatusVistoria;
import com.condocompare.vistorias.entity.TipoVistoria;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record UpdateVistoriaRequest(
    TipoVistoria tipo,
    StatusVistoria status,
    LocalDateTime dataAgendada,
    LocalDateTime dataRealizada,
    String responsavelNome,
    String responsavelTelefone,
    String responsavelEmail,
    String observacoes,
    String laudoUrl,
    UUID documentoId,
    List<Map<String, Object>> itensVistoriados,
    List<Map<String, Object>> pendencias,
    Integer notaGeral
) {}
