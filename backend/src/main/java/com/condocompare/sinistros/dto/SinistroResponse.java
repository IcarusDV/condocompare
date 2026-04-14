package com.condocompare.sinistros.dto;

import com.condocompare.sinistros.entity.HistoricoEvento;
import com.condocompare.sinistros.entity.StatusSinistro;
import com.condocompare.sinistros.entity.TipoSinistro;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SinistroResponse(
    UUID id,
    UUID condominioId,
    String condominioNome,
    UUID apoliceId,
    String numeroSinistro,
    TipoSinistro tipo,
    StatusSinistro status,
    LocalDateTime dataOcorrencia,
    LocalDateTime dataComunicacao,
    String descricao,
    String localOcorrencia,
    BigDecimal valorPrejuizo,
    BigDecimal valorFranquia,
    BigDecimal valorIndenizado,
    String coberturaAcionada,
    UUID[] documentosIds,
    String[] fotosUrls,
    List<HistoricoEvento> historico,
    String seguradoraProtocolo,
    String seguradoraContato,
    String observacoes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
