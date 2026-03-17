package com.condocompare.sinistros.dto;

import com.condocompare.sinistros.entity.TipoSinistro;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record CreateSinistroRequest(
    @NotNull(message = "Condomínio é obrigatório")
    UUID condominioId,

    UUID apoliceId,

    @NotNull(message = "Tipo é obrigatório")
    TipoSinistro tipo,

    @NotNull(message = "Data da ocorrência é obrigatória")
    LocalDateTime dataOcorrencia,

    @NotBlank(message = "Descrição é obrigatória")
    String descricao,

    String localOcorrencia,
    BigDecimal valorPrejuizo,
    String coberturaAcionada,
    String observacoes
) {}
