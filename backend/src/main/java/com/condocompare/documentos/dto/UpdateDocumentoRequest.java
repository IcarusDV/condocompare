package com.condocompare.documentos.dto;

import com.condocompare.documentos.entity.TipoDocumento;

public record UpdateDocumentoRequest(
    String nome,
    TipoDocumento tipo,
    String seguradoraNome,
    String observacoes
) {}
