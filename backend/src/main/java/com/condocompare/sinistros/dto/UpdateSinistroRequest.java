package com.condocompare.sinistros.dto;

import com.condocompare.sinistros.entity.StatusSinistro;
import com.condocompare.sinistros.entity.TipoSinistro;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record UpdateSinistroRequest(
    UUID apoliceId,
    String numeroSinistro,
    TipoSinistro tipo,
    StatusSinistro status,
    LocalDateTime dataOcorrencia,
    LocalDateTime dataComunicacao,
    String descricao,
    String localOcorrencia,
    BigDecimal valorPrejuizo,
    BigDecimal valorIndenizado,
    String coberturaAcionada,
    UUID[] documentosIds,
    String[] fotosUrls,
    String seguradoraProtocolo,
    String seguradoraContato,
    String observacoes
) {}
