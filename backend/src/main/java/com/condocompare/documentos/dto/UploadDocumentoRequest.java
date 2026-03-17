package com.condocompare.documentos.dto;

import com.condocompare.documentos.entity.TipoDocumento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UploadDocumentoRequest(
    @NotNull(message = "ID do condomínio é obrigatório")
    UUID condominioId,

    @NotNull(message = "Tipo do documento é obrigatório")
    TipoDocumento tipo,

    @NotBlank(message = "Nome do documento é obrigatório")
    String nome,

    String observacoes,

    // Campos opcionais para orçamentos
    String seguradoraNome
) {}
