package com.condocompare.sinistros.dto;

import com.condocompare.sinistros.entity.StatusSinistro;
import com.condocompare.sinistros.entity.TipoSinistro;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record SinistroListResponse(
    UUID id,
    UUID condominioId,
    String condominioNome,
    String numeroSinistro,
    TipoSinistro tipo,
    StatusSinistro status,
    LocalDateTime dataOcorrencia,
    String descricao,
    BigDecimal valorPrejuizo,
    BigDecimal valorIndenizado,
    LocalDateTime createdAt
) {}
