package com.condocompare.ia.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatConversationResponse(
    UUID id,
    String titulo,
    String contextType,
    UUID condominioId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    int messageCount
) {}
