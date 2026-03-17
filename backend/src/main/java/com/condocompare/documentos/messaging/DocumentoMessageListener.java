package com.condocompare.documentos.messaging;

import com.condocompare.common.config.RabbitMQConfig;
import com.condocompare.condominios.entity.Condominio;
import com.condocompare.condominios.repository.CondominioRepository;
import com.condocompare.documentos.entity.Documento;
import com.condocompare.documentos.entity.StatusProcessamento;
import com.condocompare.documentos.entity.TipoDocumento;
import com.condocompare.documentos.repository.DocumentoRepository;
import com.condocompare.documentos.service.MinioService;
import com.condocompare.notificacoes.entity.TipoNotificacao;
import com.condocompare.notificacoes.service.NotificacaoService;
import com.condocompare.users.entity.Role;
import com.condocompare.users.entity.User;
import com.condocompare.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.InputStream;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DocumentoMessageListener {

    private final DocumentoRepository documentoRepository;
    private final CondominioRepository condominioRepository;
    private final MinioService minioService;
    private final NotificacaoService notificacaoService;
    private final UserRepository userRepository;
    private final WebClient iaServiceWebClient;

    private static final Duration IA_TIMEOUT = Duration.ofSeconds(120);

    @RabbitListener(queues = RabbitMQConfig.QUEUE_PROCESS)
    public void processDocumento(DocumentoProcessingMessage message) {
        log.info("Recebida mensagem para processar documento: id={}, tipo={}",
                message.getDocumentoId(), message.getTipo());

        UUID documentoId = message.getDocumentoId();

        try {
            // 1. Update status to PROCESSANDO
            updateStatus(documentoId, StatusProcessamento.PROCESSANDO, null);

            // 2. Download file from MinIO
            String textoExtraido = extractTextFromFile(message);
            if (textoExtraido == null || textoExtraido.isBlank()) {
                updateStatus(documentoId, StatusProcessamento.ERRO, "Nao foi possivel extrair texto do documento");
                return;
            }

            // 3. Classify document type if OUTRO
            String tipoFinal = message.getTipo();
            if ("OUTRO".equals(tipoFinal)) {
                tipoFinal = classifyDocument(textoExtraido, message.getNomeArquivo());
                if (tipoFinal != null && !tipoFinal.equals(message.getTipo())) {
                    updateDocumentoTipo(documentoId, tipoFinal);
                }
            }

            // 4. Index in RAG + Extract data
            Map<String, Object> extractedData = indexAndExtract(
                    documentoId.toString(),
                    message.getCondominioId() != null ? message.getCondominioId().toString() : null,
                    tipoFinal,
                    textoExtraido,
                    message.getNomeArquivo()
            );

            // 5. Save extracted data to document
            if (extractedData != null && !extractedData.isEmpty()) {
                saveExtractedData(documentoId, extractedData);
            }

            // 6. Update condominio data if available
            if (extractedData != null && extractedData.containsKey("condominio_data") && message.getCondominioId() != null) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> condominioData = (Map<String, Object>) extractedData.get("condominio_data");
                    updateCondominioData(message.getCondominioId(), condominioData);
                } catch (Exception e) {
                    log.warn("Falha ao atualizar dados do condominio: {}", e.getMessage());
                }
            }

            // 7. Update status to CONCLUIDO
            updateStatus(documentoId, StatusProcessamento.CONCLUIDO, null);

            // 8. Create notification
            createProcessingNotification(documentoId, message.getCondominioId(), tipoFinal);

            log.info("Documento processado com sucesso: id={}", documentoId);

        } catch (Exception e) {
            log.error("Erro ao processar documento: id={}", documentoId, e);
            updateStatus(documentoId, StatusProcessamento.ERRO,
                    "Erro no processamento: " + e.getMessage());
        }
    }

    private String extractTextFromFile(DocumentoProcessingMessage message) {
        if (message.getMimeType() == null || !message.getMimeType().equals("application/pdf")) {
            log.info("Documento nao e PDF, ignorando extracao de texto: mimeType={}", message.getMimeType());
            return null;
        }

        try {
            InputStream fileStream = minioService.downloadFile(message.getBucketName(), message.getObjectKey());
            byte[] fileBytes = fileStream.readAllBytes();
            fileStream.close();

            // Use pypdf on the IA service to extract text
            org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return message.getNomeArquivo();
                }
            };

            org.springframework.http.client.MultipartBodyBuilder builder =
                    new org.springframework.http.client.MultipartBodyBuilder();
            builder.part("file", resource).contentType(MediaType.APPLICATION_PDF);
            builder.part("tipo", message.getTipo().toLowerCase());

            Map<String, Object> response = iaServiceWebClient.post()
                    .uri("/documents/extract")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(org.springframework.web.reactive.function.BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(IA_TIMEOUT)
                    .block();

            if (response != null && response.containsKey("texto_extraido")) {
                return (String) response.get("texto_extraido");
            }
            return null;
        } catch (Exception e) {
            log.error("Erro ao extrair texto do documento: {}", e.getMessage());
            return null;
        }
    }

    private String classifyDocument(String texto, String nomeArquivo) {
        try {
            Map<String, Object> body = Map.of(
                    "texto", texto.substring(0, Math.min(texto.length(), 2000)),
                    "nome_arquivo", nomeArquivo != null ? nomeArquivo : "desconhecido"
            );

            Map<String, Object> response = iaServiceWebClient.post()
                    .uri("/documents/classify")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(Duration.ofSeconds(30))
                    .block();

            if (response != null) {
                String tipo = (String) response.get("tipo");
                Number confianca = (Number) response.get("confianca");
                if (tipo != null && confianca != null && confianca.doubleValue() >= 0.6) {
                    log.info("Documento classificado: tipo={}, confianca={}", tipo, confianca);
                    return tipo;
                }
            }
        } catch (Exception e) {
            log.warn("Falha na classificacao automatica: {}", e.getMessage());
        }
        return "OUTRO";
    }

    private Map<String, Object> indexAndExtract(String documentoId, String condominioId,
                                                  String tipo, String texto, String nomeArquivo) {
        try {
            Map<String, Object> body = Map.of(
                    "documento_id", documentoId,
                    "condominio_id", condominioId != null ? condominioId : "",
                    "tipo_documento", tipo,
                    "texto", texto,
                    "metadata", Map.of("filename", nomeArquivo != null ? nomeArquivo : "")
            );

            Map<String, Object> response = iaServiceWebClient.post()
                    .uri("/rag/index-and-extract")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(IA_TIMEOUT)
                    .block();

            if (response != null) {
                int chunks = response.get("chunks_created") != null ?
                        ((Number) response.get("chunks_created")).intValue() : 0;
                log.info("RAG indexacao concluida: documentoId={}, chunks={}", documentoId, chunks);

                @SuppressWarnings("unchecked")
                Map<String, Object> dados = (Map<String, Object>) response.get("dados_extraidos");
                return dados;
            }
        } catch (Exception e) {
            log.warn("Falha ao indexar/extrair no RAG: {}", e.getMessage());
        }
        return null;
    }

    @Transactional
    protected void updateStatus(UUID documentoId, StatusProcessamento status, String erro) {
        documentoRepository.findById(documentoId).ifPresent(doc -> {
            doc.setStatus(status);
            if (erro != null) {
                doc.setErroProcessamento(erro);
            }
            documentoRepository.save(doc);
        });
    }

    @Transactional
    protected void updateDocumentoTipo(UUID documentoId, String tipo) {
        documentoRepository.findById(documentoId).ifPresent(doc -> {
            try {
                doc.setTipo(TipoDocumento.valueOf(tipo));
                documentoRepository.save(doc);
                log.info("Tipo do documento atualizado: id={}, tipo={}", documentoId, tipo);
            } catch (IllegalArgumentException e) {
                log.warn("Tipo invalido retornado pela classificacao: {}", tipo);
            }
        });
    }

    @Transactional
    protected void saveExtractedData(UUID documentoId, Map<String, Object> dados) {
        documentoRepository.findById(documentoId).ifPresent(doc -> {
            doc.setDadosExtraidos(dados);

            // Populate seguradora fields from extracted data if orcamento/apolice
            if (dados.containsKey("seguradoraNome") && dados.get("seguradoraNome") != null) {
                doc.setSeguradoraNome((String) dados.get("seguradoraNome"));
            }
            if (dados.containsKey("valorPremio") && dados.get("valorPremio") != null) {
                try {
                    doc.setValorPremio(new java.math.BigDecimal(dados.get("valorPremio").toString()));
                } catch (Exception e) {
                    log.warn("Falha ao converter valorPremio: {}", dados.get("valorPremio"));
                }
            }

            documentoRepository.save(doc);
            log.info("Dados extraidos salvos: documentoId={}", documentoId);
        });
    }

    @Transactional
    protected void updateCondominioData(UUID condominioId, Map<String, Object> condominioData) {
        condominioRepository.findById(condominioId).ifPresent(condo -> {
            boolean updated = false;

            if (condominioData.get("cnpj") != null && (condo.getCnpj() == null || condo.getCnpj().isBlank())) {
                condo.setCnpj((String) condominioData.get("cnpj"));
                updated = true;
            }
            if (condominioData.get("endereco") != null && (condo.getEndereco() == null || condo.getEndereco().isBlank())) {
                condo.setEndereco((String) condominioData.get("endereco"));
                updated = true;
            }
            if (condominioData.get("cidade") != null && (condo.getCidade() == null || condo.getCidade().isBlank())) {
                condo.setCidade((String) condominioData.get("cidade"));
                updated = true;
            }
            if (condominioData.get("estado") != null && (condo.getEstado() == null || condo.getEstado().isBlank())) {
                condo.setEstado((String) condominioData.get("estado"));
                updated = true;
            }
            if (condominioData.get("cep") != null && (condo.getCep() == null || condo.getCep().isBlank())) {
                condo.setCep((String) condominioData.get("cep"));
                updated = true;
            }
            if (condominioData.get("areaConstruida") != null && condo.getAreaConstruida() == null) {
                try {
                    condo.setAreaConstruida(new java.math.BigDecimal(condominioData.get("areaConstruida").toString()));
                    updated = true;
                } catch (Exception ignored) {}
            }
            if (condominioData.get("numeroUnidades") != null && condo.getNumeroUnidades() == null) {
                try {
                    condo.setNumeroUnidades(((Number) condominioData.get("numeroUnidades")).intValue());
                    updated = true;
                } catch (Exception ignored) {}
            }
            if (condominioData.get("numeroBlocos") != null && condo.getNumeroBlocos() == null) {
                try {
                    condo.setNumeroBlocos(((Number) condominioData.get("numeroBlocos")).intValue());
                    updated = true;
                } catch (Exception ignored) {}
            }

            if (updated) {
                condominioRepository.save(condo);
                log.info("Dados do condominio atualizados automaticamente: id={}", condominioId);
            }
        });
    }

    private void createProcessingNotification(UUID documentoId, UUID condominioId, String tipo) {
        try {
            String condominioNome = "N/A";
            if (condominioId != null) {
                condominioNome = condominioRepository.findById(condominioId)
                        .map(Condominio::getNome)
                        .orElse("N/A");
            }

            String titulo = "Documento processado com sucesso";
            String mensagem = String.format("[%s] Documento do tipo %s foi processado automaticamente.",
                    condominioNome, tipo);

            // Notify ADMIN and CORRETORA users
            List<User> usuarios = userRepository.findByRoleInAndActiveTrue(
                    List.of(Role.ADMIN, Role.CORRETORA)
            );

            for (User user : usuarios) {
                notificacaoService.criarNotificacao(
                        user.getId(),
                        TipoNotificacao.DOCUMENTO_PROCESSADO,
                        titulo,
                        mensagem,
                        "DOCUMENTO",
                        documentoId
                );
            }
        } catch (Exception e) {
            log.warn("Falha ao criar notificacao de processamento: {}", e.getMessage());
        }
    }
}
