package com.condocompare.vistorias.dto;

import com.condocompare.vistorias.entity.StatusVistoria;
import com.condocompare.vistorias.entity.TipoVistoria;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record VistoriaResponse(
    UUID id,
    UUID condominioId,
    String condominioNome,
    TipoVistoria tipo,
    StatusVistoria status,
    LocalDateTime dataAgendada,
    LocalDateTime dataRealizada,
    String responsavelNome,
    String responsavelTelefone,
    String responsavelEmail,
    String observacoes,
    String laudoUrl,
    String laudoTexto,
    LocalDateTime laudoGeradoEm,
    UUID documentoId,
    List<Map<String, Object>> itensVistoriados,
    List<Map<String, Object>> pendencias,
    Integer notaGeral,
    Integer totalItens,
    Integer itensConformes,
    Integer itensNaoConformes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    String sharedToken
) {}
