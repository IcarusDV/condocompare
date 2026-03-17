package com.condocompare.documentos.dto;

import com.condocompare.documentos.entity.StatusProcessamento;
import com.condocompare.documentos.entity.TipoDocumento;

import java.util.UUID;

public record DocumentoFilter(
    UUID condominioId,
    TipoDocumento tipo,
    StatusProcessamento status,
    String seguradora,
    String search
) {}
