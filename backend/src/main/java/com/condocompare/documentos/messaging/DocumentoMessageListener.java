package com.condocompare.documentos.messaging;

import com.condocompare.common.config.RabbitMQConfig;
import com.condocompare.condominios.entity.Condominio;
import com.condocompare.condominios.repository.CondominioRepository;
import com.condocompare.documentos.entity.Documento;
import com.condocompare.documentos.entity.StatusProcessamento;
import com.condocompare.documentos.entity.TipoDocumento;
import com.condocompare.documentos.repository.DocumentoRepository;
import com.condocompare.documentos.service.MinioService;
import com.condocompare.documentos.service.PdfExtractionService;
import com.condocompare.notificacoes.entity.TipoNotificacao;
import com.condocompare.notificacoes.service.NotificacaoService;
import com.condocompare.users.entity.Role;
import com.condocompare.users.entity.User;
import com.condocompare.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
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
    private final PdfExtractionService pdfExtractionService;
    private final WebClient iaServiceWebClient;

    private static final int MAX_RETRIES = 3;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_PROCESS)
    public void processDocumento(DocumentoProcessingMessage message) {
        log.info("Recebida mensagem para processar documento: id={}, tipo={}",
                message.getDocumentoId(), message.getTipo());

        UUID documentoId = message.getDocumentoId();

        try {
            updateStatus(documentoId, StatusProcessamento.PROCESSANDO, null);
            processWithRetry(message, documentoId);
        } catch (Exception e) {
            log.error("Erro ao processar documento apos {} tentativas: id={}", MAX_RETRIES, documentoId, e);
            updateStatus(documentoId, StatusProcessamento.ERRO,
                    "Erro no processamento apos " + MAX_RETRIES + " tentativas: " + e.getMessage());
        }
    }

    private void processWithRetry(DocumentoProcessingMessage message, UUID documentoId) throws Exception {
        Exception lastException = null;

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                doProcess(message, documentoId);
                return; // Success
            } catch (Exception e) {
                lastException = e;
                log.warn("Tentativa {}/{} falhou para documento {}: {}", attempt, MAX_RETRIES, documentoId, e.getMessage());
                if (attempt < MAX_RETRIES) {
                    long backoff = (long) Math.pow(2, attempt) * 1000; // 2s, 4s
                    Thread.sleep(backoff);
                }
            }
        }
        throw lastException;
    }

    private void doProcess(DocumentoProcessingMessage message, UUID documentoId) throws Exception {
        // 1. Extract text
        String textoExtraido = extractTextFromFile(message);
        if (textoExtraido == null || textoExtraido.isBlank()) {
            throw new RuntimeException("Nao foi possivel extrair texto do documento");
        }

        // 2. Classify if OUTRO
        String tipoFinal = message.getTipo();
        if ("OUTRO".equals(tipoFinal)) {
            tipoFinal = classifyDocument(textoExtraido, message.getNomeArquivo());
            if (tipoFinal != null && !tipoFinal.equals(message.getTipo())) {
                updateDocumentoTipo(documentoId, tipoFinal);
            }
        }

        // 3. Index in RAG + Extract data
        Map<String, Object> extractedData = indexAndExtract(
                documentoId.toString(),
                message.getCondominioId() != null ? message.getCondominioId().toString() : null,
                tipoFinal,
                textoExtraido,
                message.getNomeArquivo()
        );

        // 4. Save extracted data
        if (extractedData != null && !extractedData.isEmpty()) {
            saveExtractedData(documentoId, extractedData);
        }

        // 5. Update condominio
        if (extractedData != null && extractedData.containsKey("condominio_data") && message.getCondominioId() != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> condominioData = (Map<String, Object>) extractedData.get("condominio_data");
                updateCondominioData(message.getCondominioId(), condominioData);
            } catch (Exception e) {
                log.warn("Falha ao atualizar dados do condominio: {}", e.getMessage());
            }
        }

        // 6. Success
        updateStatus(documentoId, StatusProcessamento.CONCLUIDO, null);
        createProcessingNotification(documentoId, message.getCondominioId(), tipoFinal);
        log.info("Documento processado com sucesso: id={}", documentoId);
    }

    private String extractTextFromFile(DocumentoProcessingMessage message) {
        String mimeType = message.getMimeType();
        if (mimeType == null) {
            log.error("MimeType nulo para documento: id={}", message.getDocumentoId());
            return null;
        }

        log.info("Iniciando extração: id={}, bucket={}, key={}, mime={}",
                message.getDocumentoId(), message.getBucketName(), message.getObjectKey(), mimeType);

        try {
            // 1. Download do storage
            log.info("Baixando arquivo do storage...");
            InputStream fileStream = minioService.downloadFile(message.getBucketName(), message.getObjectKey());
            byte[] fileBytes = fileStream.readAllBytes();
            fileStream.close();
            log.info("Arquivo baixado: {} bytes", fileBytes.length);

            if (fileBytes.length == 0) {
                log.error("Arquivo vazio após download!");
                return null;
            }

            // 2. Extrair texto
            if ("application/pdf".equals(mimeType)) {
                log.info("Extraindo texto do PDF...");
                String text = pdfExtractionService.extractText(fileBytes);
                log.info("Texto extraído: {} chars", text != null ? text.length() : 0);
                return text;
            }

            log.warn("Extração nativa suporta apenas PDF. Tipo: {}", mimeType);
            return null;
        } catch (Exception e) {
            log.error("Erro ao extrair texto do documento id={}: {} - {}",
                    message.getDocumentoId(), e.getClass().getSimpleName(), e.getMessage(), e);
            return null;
        }
    }

    private String classifyDocument(String texto, String nomeArquivo) {
        return pdfExtractionService.classifyDocument(texto, nomeArquivo);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> indexAndExtract(String documentoId, String condominioId,
                                                  String tipo, String texto, String nomeArquivo) {
        Map<String, Object> extractedData = null;

        // 1. Try RAG index-and-extract (indexes chunks for search AND extracts data via Claude)
        try {
            log.info("Indexando documento no RAG e extraindo dados via Claude: {}", documentoId);
            Map<String, Object> ragBody = new java.util.HashMap<>();
            ragBody.put("documento_id", documentoId);
            ragBody.put("condominio_id", condominioId);
            ragBody.put("tipo_documento", tipo != null ? tipo : "OUTRO");
            ragBody.put("texto", texto);
            ragBody.put("metadata", Map.of("filename", nomeArquivo != null ? nomeArquivo : ""));

            Map<String, Object> ragResponse = iaServiceWebClient.post()
                .uri("/rag/index-and-extract")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ragBody)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .timeout(Duration.ofSeconds(120))
                .block();

            if (ragResponse != null) {
                log.info("RAG indexing concluido: documentoId={}, chunks={}",
                        documentoId, ragResponse.get("chunks_created"));

                Map<String, Object> dados = (Map<String, Object>) ragResponse.get("dados_extraidos");
                if (dados != null && !dados.isEmpty()) {
                    log.info("Extracao Claude (via RAG) concluida: {} campos extraidos", dados.size());
                    extractedData = dados;
                }
            }
        } catch (Exception e) {
            log.warn("RAG index-and-extract falhou: {}. Tentando fallback.", e.getMessage());
        }

        // 2. Fallback: try Claude extraction via /documents/extract-text if RAG failed
        if (extractedData == null) {
            try {
                log.info("Tentando extracao via /documents/extract-text para documento: {}", documentoId);
                Map<String, Object> body = Map.of(
                    "texto", texto,
                    "tipo", tipo.toLowerCase()
                );

                Map<String, Object> response = iaServiceWebClient.post()
                    .uri("/documents/extract-text")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(Duration.ofSeconds(60))
                    .block();

                if (response != null && response.containsKey("dados_extraidos")) {
                    Map<String, Object> dados = (Map<String, Object>) response.get("dados_extraidos");
                    if (dados != null && !dados.isEmpty()) {
                        log.info("Extracao Claude concluida: {} campos extraidos", dados.size());
                        extractedData = dados;
                    }
                }
            } catch (Exception e) {
                log.warn("Extracao Claude tambem falhou: {}", e.getMessage());
            }
        }

        // 3. Final fallback: PDFBox regex extraction
        if (extractedData == null) {
            try {
                extractedData = pdfExtractionService.extractData(texto, tipo, nomeArquivo);
            } catch (Exception e) {
                log.warn("Extracao PDFBox tambem falhou: {}", e.getMessage());
                return null;
            }
        }

        return extractedData;
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

            // Populate seguradora
            if (dados.containsKey("seguradoraNome") && dados.get("seguradoraNome") != null) {
                doc.setSeguradoraNome((String) dados.get("seguradoraNome"));
            }

            // Populate valor prêmio
            if (dados.containsKey("valorPremio") && dados.get("valorPremio") != null) {
                try {
                    doc.setValorPremio(new java.math.BigDecimal(dados.get("valorPremio").toString()));
                } catch (Exception e) {
                    log.warn("Falha ao converter valorPremio: {}", dados.get("valorPremio"));
                }
            }

            // Populate datas de vigência
            if (dados.containsKey("dataVigenciaInicio") && dados.get("dataVigenciaInicio") != null) {
                try {
                    doc.setDataVigenciaInicio(java.time.LocalDate.parse((String) dados.get("dataVigenciaInicio")));
                } catch (Exception e) {
                    log.warn("Falha ao converter dataVigenciaInicio: {}", dados.get("dataVigenciaInicio"));
                }
            }
            if (dados.containsKey("dataVigenciaFim") && dados.get("dataVigenciaFim") != null) {
                try {
                    doc.setDataVigenciaFim(java.time.LocalDate.parse((String) dados.get("dataVigenciaFim")));
                } catch (Exception e) {
                    log.warn("Falha ao converter dataVigenciaFim: {}", dados.get("dataVigenciaFim"));
                }
            }

            // Estruturar dadosExtraidos no formato DadosOrcamentoDTO para comparação
            if (dados.containsKey("coberturas")) {
                Map<String, Object> dadosOrcamento = new java.util.HashMap<>();
                dadosOrcamento.put("coberturas", dados.get("coberturas"));
                if (dados.containsKey("formaPagamento")) {
                    dadosOrcamento.put("formaPagamento", dados.get("formaPagamento"));
                }
                // Salvar no formato que toOrcamentoComparacaoDTO espera
                dados.put("dadosOrcamento", dadosOrcamento);
                doc.setDadosExtraidos(dados);
            }

            documentoRepository.save(doc);
            log.info("Dados extraidos salvos: documentoId={}, campos={}", documentoId, dados.keySet());
        });
    }

    @Transactional
    public void updateCondominioData(UUID condominioId, Map<String, Object> condominioData) {
        condominioRepository.findById(condominioId).ifPresent(condo -> {
            boolean updated = false;

            // Helper para extrair string limpa
            java.util.function.Function<String, String> getStr = (key) -> {
                Object v = condominioData.get(key);
                if (v == null) return null;
                String s = String.valueOf(v).trim();
                return s.isEmpty() || "null".equalsIgnoreCase(s) ? null : s;
            };

            // Helper para extrair número
            java.util.function.Function<String, Integer> getInt = (key) -> {
                Object v = condominioData.get(key);
                if (v == null) return null;
                try { return ((Number) v).intValue(); }
                catch (Exception e) {
                    try { return Integer.parseInt(String.valueOf(v).trim()); }
                    catch (Exception ex) { return null; }
                }
            };

            // Strings - SEMPRE atualiza se vier valor
            String nome = getStr.apply("nome");
            if (nome != null && !nome.equals(condo.getNome())) {
                condo.setNome(nome);
                updated = true;
            }
            String cnpj = getStr.apply("cnpj");
            if (cnpj != null && !cnpj.equals(condo.getCnpj())) {
                condo.setCnpj(cnpj);
                updated = true;
            }
            String endereco = getStr.apply("endereco");
            if (endereco != null && !endereco.equals(condo.getEndereco())) {
                condo.setEndereco(endereco);
                updated = true;
            }
            String numero = getStr.apply("numero");
            if (numero != null && !numero.equals(condo.getNumero())) {
                condo.setNumero(numero);
                updated = true;
            }
            String bairro = getStr.apply("bairro");
            if (bairro != null && !bairro.equals(condo.getBairro())) {
                condo.setBairro(bairro);
                updated = true;
            }
            String cidade = getStr.apply("cidade");
            if (cidade != null && !cidade.equals(condo.getCidade())) {
                condo.setCidade(cidade);
                updated = true;
            }
            String estado = getStr.apply("estado");
            if (estado != null && !estado.equals(condo.getEstado())) {
                condo.setEstado(estado);
                updated = true;
            }
            String cep = getStr.apply("cep");
            if (cep != null && !cep.equals(condo.getCep())) {
                condo.setCep(cep);
                updated = true;
            }

            // Numéricos
            Integer unidades = getInt.apply("numeroUnidades");
            if (unidades != null && !unidades.equals(condo.getNumeroUnidades())) {
                condo.setNumeroUnidades(unidades);
                updated = true;
            }
            Integer blocos = getInt.apply("numeroBlocos");
            if (blocos != null && !blocos.equals(condo.getNumeroBlocos())) {
                condo.setNumeroBlocos(blocos);
                updated = true;
            }
            Integer andares = getInt.apply("numeroAndares");
            if (andares != null && !andares.equals(condo.getNumeroAndares())) {
                condo.setNumeroAndares(andares);
                updated = true;
            }
            Integer elevadores = getInt.apply("numeroElevadores");
            if (elevadores != null && !elevadores.equals(condo.getNumeroElevadores())) {
                condo.setNumeroElevadores(elevadores);
                updated = true;
            }
            Integer anoConstrucao = getInt.apply("anoConstrucao");
            if (anoConstrucao != null && !anoConstrucao.equals(condo.getAnoConstrucao())) {
                condo.setAnoConstrucao(anoConstrucao);
                updated = true;
            }

            // Área construída (BigDecimal)
            Object areaObj = condominioData.get("areaConstruida");
            if (areaObj != null) {
                try {
                    java.math.BigDecimal area = new java.math.BigDecimal(areaObj.toString());
                    if (!area.equals(condo.getAreaConstruida())) {
                        condo.setAreaConstruida(area);
                        updated = true;
                    }
                } catch (Exception ignored) {}
            }

            // Tipo de construção
            String tipoStr = getStr.apply("tipoConstrucao");
            if (tipoStr != null) {
                try {
                    com.condocompare.condominios.entity.TipoConstrucao tipo =
                        com.condocompare.condominios.entity.TipoConstrucao.valueOf(tipoStr.toUpperCase());
                    if (tipo != condo.getTipoConstrucao()) {
                        condo.setTipoConstrucao(tipo);
                        updated = true;
                    }
                } catch (Exception ignored) {}
            }

            if (updated) {
                condominioRepository.save(condo);
                log.info("Dados do condominio atualizados automaticamente: id={}", condominioId);
            } else {
                log.info("Nenhum campo do condominio precisava ser atualizado: id={}", condominioId);
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
