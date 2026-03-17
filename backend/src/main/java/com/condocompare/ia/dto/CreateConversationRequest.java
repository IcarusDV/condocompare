package com.condocompare.ia.dto;

import java.util.UUID;

public record CreateConversationRequest(
    String titulo,
    String contextType,
    UUID condominioId
) {}
