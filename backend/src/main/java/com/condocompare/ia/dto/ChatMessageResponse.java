package com.condocompare.ia.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatMessageResponse(
    UUID id,
    String role,
    String content,
    String sources,
    LocalDateTime createdAt
) {}
