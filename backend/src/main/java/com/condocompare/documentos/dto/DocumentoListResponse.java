package com.condocompare.documentos.dto;

import com.condocompare.documentos.entity.StatusProcessamento;
import com.condocompare.documentos.entity.TipoDocumento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentoListResponse(
    UUID id,
    UUID condominioId,
    TipoDocumento tipo,
    String nome,
    String nomeArquivo,
    String mimeType,
    Long tamanhoBytes,
    StatusProcessamento status,
    String seguradoraNome,
    BigDecimal valorPremio,
    LocalDate dataVigenciaFim,
    LocalDateTime createdAt
) {}
