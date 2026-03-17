package com.condocompare.documentos.messaging;

import com.condocompare.common.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DocumentoMessagePublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishDocumentoUploaded(DocumentoProcessingMessage message) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE,
                    RabbitMQConfig.ROUTING_KEY_UPLOADED,
                    message
            );
            log.info("Mensagem publicada na fila: documentoId={}, tipo={}",
                    message.getDocumentoId(), message.getTipo());
        } catch (Exception e) {
            log.error("Erro ao publicar mensagem na fila: documentoId={}", message.getDocumentoId(), e);
            throw new RuntimeException("Erro ao enfileirar documento para processamento", e);
        }
    }
}
