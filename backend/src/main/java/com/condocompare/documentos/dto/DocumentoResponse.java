package com.condocompare.documentos.dto;

import com.condocompare.documentos.entity.StatusProcessamento;
import com.condocompare.documentos.entity.TipoDocumento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public record DocumentoResponse(
    UUID id,
    UUID condominioId,
    TipoDocumento tipo,
    String nome,
    String nomeArquivo,
    String mimeType,
    Long tamanhoBytes,
    StatusProcessamento status,
    String erroProcessamento,
    Map<String, Object> dadosExtraidos,
    String observacoes,
    String seguradoraNome,
    BigDecimal valorPremio,
    LocalDate dataVigenciaInicio,
    LocalDate dataVigenciaFim,
    LocalDateTime createdAt,
    String createdBy
) {}
