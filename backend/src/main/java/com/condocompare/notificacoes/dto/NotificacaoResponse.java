package com.condocompare.notificacoes.dto;

import com.condocompare.notificacoes.entity.TipoNotificacao;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificacaoResponse(
    UUID id,
    TipoNotificacao tipo,
    String titulo,
    String mensagem,
    Boolean lida,
    LocalDateTime dataLeitura,
    String referenciaTipo,
    UUID referenciaId,
    LocalDateTime createdAt
) {}
