package com.condocompare.vistorias.dto;

import com.condocompare.vistorias.entity.TipoVistoria;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateVistoriaRequest(
    @NotNull(message = "Condomínio é obrigatório")
    UUID condominioId,

    @NotNull(message = "Tipo é obrigatório")
    TipoVistoria tipo,

    @NotNull(message = "Data agendada é obrigatória")
    LocalDateTime dataAgendada,

    String responsavelNome,
    String responsavelTelefone,
    String responsavelEmail,
    String observacoes
) {}
