package com.condocompare.ia.dto;

import java.util.Map;
import java.util.UUID;

public record DocumentExtractResponse(
    UUID documentoId,
    String tipo,
    Map<String, Object> dadosExtraidos,
    int chunksCreated,
    String status,
    String textoExtraido
) {}
