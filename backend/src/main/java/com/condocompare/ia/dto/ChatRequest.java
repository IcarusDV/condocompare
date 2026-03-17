package com.condocompare.ia.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

public record ChatRequest(
    @NotBlank(message = "Mensagem é obrigatória")
    String message,
    UUID condominioId,
    List<ChatMessageDTO> history,
    String contextType
) {
    public ChatRequest {
        if (history == null) {
            history = List.of();
        }
        if (contextType == null || contextType.isBlank()) {
            contextType = "geral";
        }
    }
}
