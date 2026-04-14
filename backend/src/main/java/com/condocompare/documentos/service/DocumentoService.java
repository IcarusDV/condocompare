package com.condocompare.documentos.service;

import com.condocompare.common.exception.BusinessException;
import com.condocompare.condominios.entity.Condominio;
import com.condocompare.condominios.repository.CondominioRepository;
import com.condocompare.documentos.dto.*;
import com.condocompare.documentos.entity.Documento;
import com.condocompare.documentos.entity.StatusProcessamento;
import com.condocompare.documentos.entity.TipoDocumento;
import com.condocompare.documentos.mapper.DocumentoMapper;
import com.condocompare.documentos.messaging.DocumentoMessagePublisher;
import com.condocompare.documentos.messaging.DocumentoProcessingMessage;
import com.condocompare.documentos.repository.DocumentoRepository;
import com.condocompare.documentos.repository.DocumentoSpecification;
import com.condocompare.users.entity.Role;
import com.condocompare.users.entity.User;
import com.condocompare.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentoService {

    private final DocumentoRepository documentoRepository;
    private final DocumentoMapper documentoMapper;
    private final MinioService minioService;
    private final CondominioRepository condominioRepository;
    private final UserRepository userRepository;
    private final DocumentoMessagePublisher messagePublisher;
    private final PdfExtractionService pdfExtractionService;
    private final org.springframework.web.reactive.function.client.WebClient iaServiceWebClient;
    private final com.condocompare.documentos.messaging.DocumentoMessageListener documentoMessageListener;

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    @Transactional
    public DocumentoResponse upload(MultipartFile file, UploadDocumentoRequest request) {
        User currentUser = getCurrentUser();

        // Valida acesso ao condomínio
        Condominio condominio = validateCondominioAccess(request.condominioId(), currentUser);

        // Valida arquivo
        validateFile(file);

        // Faz upload para MinIO
        String objectKey = minioService.uploadFile(
            file,
            request.condominioId(),
            request.tipo().name().toLowerCase()
        );

        // Cria registro no banco
        Documento documento = new Documento();
        documento.setCondominioId(request.condominioId());
        documento.setTipo(request.tipo());
        documento.setNome(request.nome());
        documento.setNomeArquivo(file.getOriginalFilename());
        documento.setNomeArquivoStorage(objectKey);
        documento.setMimeType(file.getContentType());
        documento.setTamanhoBytes(file.getSize());
        documento.setBucketName(minioService.getDefaultBucket());
        documento.setObjectKey(objectKey);
        documento.setStatus(StatusProcessamento.PENDENTE);
        documento.setObservacoes(request.observacoes());
        documento.setSeguradoraNome(request.seguradoraNome());
        documento.setActive(true);

        Documento saved = documentoRepository.save(documento);
        log.info("Documento uploaded: id={}, condominio={}, tipo={}, user={}",
            saved.getId(), request.condominioId(), request.tipo(), currentUser.getEmail());

        // Enviar para fila de processamento (RabbitMQ)
        try {
            DocumentoProcessingMessage message = new DocumentoProcessingMessage(
                    saved.getId(),
                    request.condominioId(),
                    request.tipo().name(),
                    objectKey,
                    minioService.getDefaultBucket(),
                    file.getContentType(),
                    file.getOriginalFilename()
            );
            messagePublisher.publishDocumentoUploaded(message);
            log.info("Documento enfileirado para processamento: id={}", saved.getId());
        } catch (Exception e) {
            log.warn("Falha ao enfileirar documento para processamento: id={}.", saved.getId(), e);
            saved.setStatus(StatusProcessamento.ERRO);
            saved.setErroProcessamento("Fila de processamento indisponivel. Use o botao Reprocessar.");
            documentoRepository.save(saved);
        }

        return documentoMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public DocumentoResponse findById(UUID id) {
        User currentUser = getCurrentUser();
        Documento documento = findDocumentoWithAccessCheck(id, currentUser);
        return documentoMapper.toResponse(documento);
    }

    @Transactional(readOnly = true)
    public Page<DocumentoListResponse> findAll(DocumentoFilter filter, Pageable pageable) {
        User currentUser = getCurrentUser();

        // Aplica filtro de acesso
        UUID condominioFilter = filter != null ? filter.condominioId() : null;

        // Valida acesso se filtro de condomínio específico
        if (condominioFilter != null) {
            validateCondominioAccess(condominioFilter, currentUser);
        }

        Page<Documento> page = documentoRepository.findAll(
            DocumentoSpecification.withFilter(filter, null),
            pageable
        );

        return page.map(documentoMapper::toListResponse);
    }

    @Transactional(readOnly = true)
    public List<DocumentoListResponse> findByCondominio(UUID condominioId) {
        User currentUser = getCurrentUser();
        validateCondominioAccess(condominioId, currentUser);

        return documentoRepository.findByCondominioIdAndActiveTrue(condominioId)
            .stream()
            .map(documentoMapper::toListResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentoListResponse> findByCondominioAndTipo(UUID condominioId, TipoDocumento tipo) {
        User currentUser = getCurrentUser();
        validateCondominioAccess(condominioId, currentUser);

        return documentoRepository.findByCondominioIdAndTipoAndActiveTrue(condominioId, tipo)
            .stream()
            .map(documentoMapper::toListResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentoListResponse> findOrcamentosParaComparacao(UUID condominioId) {
        User currentUser = getCurrentUser();
        validateCondominioAccess(condominioId, currentUser);

        return documentoRepository.findOrcamentosProcessados(condominioId)
            .stream()
            .map(documentoMapper::toListResponse)
            .toList();
    }

    public String getDownloadUrl(UUID id) {
        User currentUser = getCurrentUser();
        Documento documento = findDocumentoWithAccessCheck(id, currentUser);

        return minioService.getPresignedUrl(documento.getObjectKey(), 60); // 60 min
    }

    public InputStream download(UUID id) {
        User currentUser = getCurrentUser();
        Documento documento = findDocumentoWithAccessCheck(id, currentUser);

        return minioService.downloadFile(documento.getObjectKey());
    }

    @Transactional
    public void delete(UUID id) {
        User currentUser = getCurrentUser();

        // Apenas ADMIN e CORRETORA podem deletar
        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.CORRETORA) {
            throw new BusinessException("Sem permissão para deletar documentos");
        }

        Documento documento = findDocumentoWithAccessCheck(id, currentUser);

        // Soft delete
        documento.setActive(false);
        documentoRepository.save(documento);

        // Remove do MinIO (opcional - pode manter para auditoria)
        // minioService.deleteFile(documento.getObjectKey());

        log.info("Documento deletado (soft): id={}, user={}", id, currentUser.getEmail());
    }

    @Transactional
    public void updateStatus(UUID id, StatusProcessamento status, String erro) {
        Documento documento = documentoRepository.findById(id)
            .orElseThrow(() -> new BusinessException("Documento não encontrado"));

        documento.setStatus(status);
        if (erro != null) {
            documento.setErroProcessamento(erro);
        }
        documentoRepository.save(documento);

        log.info("Status do documento atualizado: id={}, status={}", id, status);
    }

    @Transactional
    public DocumentoResponse updateDocumento(UUID id, UpdateDocumentoRequest request) {
        User currentUser = getCurrentUser();
        Documento documento = findDocumentoWithAccessCheck(id, currentUser);

        if (request.nome() != null) documento.setNome(request.nome());
        if (request.tipo() != null) documento.setTipo(request.tipo());
        if (request.seguradoraNome() != null) documento.setSeguradoraNome(request.seguradoraNome());
        if (request.observacoes() != null) documento.setObservacoes(request.observacoes());

        Documento saved = documentoRepository.save(documento);
        log.info("Documento updated: id={}, user={}", id, currentUser.getEmail());

        return documentoMapper.toResponse(saved);
    }

    @Transactional
    public DocumentoResponse reprocess(UUID id) {
        User currentUser = getCurrentUser();
        Documento documento = findDocumentoWithAccessCheck(id, currentUser);

        if (documento.getStatus() == StatusProcessamento.PROCESSANDO) {
            throw new BusinessException("Documento já está em processamento");
        }

        log.info("=== REPROCESS SÍNCRONO INICIADO: id={}, arquivo={} ===", id, documento.getNomeArquivo());

        try {
            // 1. Download do storage
            log.info("Baixando arquivo: bucket={}, key={}", documento.getBucketName(), documento.getObjectKey());
            InputStream fileStream = minioService.downloadFile(documento.getBucketName(), documento.getObjectKey());
            byte[] fileBytes = fileStream.readAllBytes();
            fileStream.close();
            log.info("Arquivo baixado: {} bytes", fileBytes.length);

            // 2. Extrair texto do PDF
            String texto = pdfExtractionService.extractText(fileBytes);
            if (texto == null || texto.isBlank()) {
                throw new BusinessException("Não foi possível extrair texto do PDF");
            }
            log.info("Texto extraído: {} chars", texto.length());

            // 3. Chamar Claude DIRETO via /rag/index-and-extract
            Map<String, Object> ragBody = new HashMap<>();
            ragBody.put("documento_id", documento.getId().toString());
            ragBody.put("condominio_id", documento.getCondominioId() != null ? documento.getCondominioId().toString() : null);
            ragBody.put("tipo_documento", documento.getTipo().name());
            ragBody.put("texto", texto);
            ragBody.put("metadata", Map.of("filename", documento.getNomeArquivo() != null ? documento.getNomeArquivo() : ""));

            log.info("Chamando Claude via ia-service...");
            @SuppressWarnings("unchecked")
            Map<String, Object> response = iaServiceWebClient.post()
                .uri("/rag/index-and-extract")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(ragBody)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(java.time.Duration.ofSeconds(180))
                .block();

            if (response == null) {
                throw new BusinessException("ia-service retornou resposta vazia");
            }
            log.info("Resposta do ia-service: chunks={}, success={}", response.get("chunks_created"), response.get("success"));

            @SuppressWarnings("unchecked")
            Map<String, Object> dadosExtraidos = (Map<String, Object>) response.get("dados_extraidos");
            if (dadosExtraidos == null || dadosExtraidos.isEmpty() || dadosExtraidos.containsKey("erro")) {
                String erro = dadosExtraidos != null ? String.valueOf(dadosExtraidos.get("erro")) : "vazio";
                throw new BusinessException("Claude não conseguiu extrair dados: " + erro);
            }

            log.info("Dados extraídos pelo Claude: campos={}", dadosExtraidos.keySet());

            // 4. Salvar dados extraídos no documento
            documento.setDadosExtraidos(dadosExtraidos);

            if (dadosExtraidos.containsKey("seguradoraNome") && dadosExtraidos.get("seguradoraNome") != null) {
                documento.setSeguradoraNome(String.valueOf(dadosExtraidos.get("seguradoraNome")));
            }
            if (dadosExtraidos.containsKey("valorPremio") && dadosExtraidos.get("valorPremio") != null) {
                try {
                    documento.setValorPremio(new BigDecimal(dadosExtraidos.get("valorPremio").toString()));
                } catch (Exception e) {
                    log.warn("Falha ao converter valorPremio: {}", dadosExtraidos.get("valorPremio"));
                }
            }
            if (dadosExtraidos.containsKey("dataVigenciaInicio") && dadosExtraidos.get("dataVigenciaInicio") != null) {
                try {
                    documento.setDataVigenciaInicio(java.time.LocalDate.parse(String.valueOf(dadosExtraidos.get("dataVigenciaInicio"))));
                } catch (Exception e) {
                    log.warn("Falha ao converter dataVigenciaInicio: {}", dadosExtraidos.get("dataVigenciaInicio"));
                }
            }
            if (dadosExtraidos.containsKey("dataVigenciaFim") && dadosExtraidos.get("dataVigenciaFim") != null) {
                try {
                    documento.setDataVigenciaFim(java.time.LocalDate.parse(String.valueOf(dadosExtraidos.get("dataVigenciaFim"))));
                } catch (Exception e) {
                    log.warn("Falha ao converter dataVigenciaFim: {}", dadosExtraidos.get("dataVigenciaFim"));
                }
            }

            // Estrutura dadosOrcamento para a comparação
            if (dadosExtraidos.containsKey("coberturas")) {
                Map<String, Object> dadosOrcamento = new HashMap<>();
                dadosOrcamento.put("coberturas", dadosExtraidos.get("coberturas"));
                if (dadosExtraidos.containsKey("formaPagamento")) {
                    dadosOrcamento.put("formaPagamento", dadosExtraidos.get("formaPagamento"));
                }
                dadosExtraidos.put("dadosOrcamento", dadosOrcamento);
                documento.setDadosExtraidos(dadosExtraidos);
            }

            documento.setStatus(StatusProcessamento.CONCLUIDO);
            documento.setErroProcessamento(null);
            documentoRepository.save(documento);

            // 5. Atualizar dados do condomínio com info extraída
            if (documento.getCondominioId() != null && dadosExtraidos.containsKey("condominio_data")) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> condominioData = (Map<String, Object>) dadosExtraidos.get("condominio_data");
                    if (condominioData != null && !condominioData.isEmpty()) {
                        documentoMessageListener.updateCondominioData(documento.getCondominioId(), condominioData);
                        log.info("Condomínio atualizado com dados extraídos: id={}", documento.getCondominioId());
                    }
                } catch (Exception e) {
                    log.warn("Falha ao atualizar condomínio com dados extraídos: {}", e.getMessage());
                }
            }

            log.info("=== REPROCESS CONCLUÍDO: id={}, premio={}, coberturas={} ===",
                id, documento.getValorPremio(),
                dadosExtraidos.get("coberturas") != null ? ((List<?>)dadosExtraidos.get("coberturas")).size() : 0);

            return documentoMapper.toResponse(documento);
        } catch (BusinessException e) {
            documento.setStatus(StatusProcessamento.ERRO);
            documento.setErroProcessamento(e.getMessage());
            documentoRepository.save(documento);
            throw e;
        } catch (Exception e) {
            log.error("Erro no reprocess: id={}", id, e);
            documento.setStatus(StatusProcessamento.ERRO);
            documento.setErroProcessamento("Erro: " + e.getMessage());
            documentoRepository.save(documento);
            throw new BusinessException("Erro ao reprocessar: " + e.getMessage());
        }
    }

    // === Métodos auxiliares ===

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Arquivo é obrigatório");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("Arquivo excede o tamanho máximo de 50MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new BusinessException("Tipo de arquivo não permitido. Permitidos: PDF, JPEG, PNG, WEBP, DOC, DOCX");
        }

        // Valida magic bytes (warning only - não bloqueia upload)
        try {
            validateMagicBytes(file, contentType);
        } catch (BusinessException e) {
            log.warn("Magic bytes mismatch (upload permitido): {}", e.getMessage());
        }
    }

    /**
     * Valida os primeiros bytes do arquivo (magic bytes) contra o Content-Type declarado.
     * Impede que um atacante envie um .exe declarando ser application/pdf.
     */
    private void validateMagicBytes(MultipartFile file, String contentType) {
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new BusinessException("Erro ao ler arquivo: " + e.getMessage());
        }
        if (fileBytes.length < 4) {
            throw new BusinessException("Arquivo inválido ou corrompido");
        }
        byte[] header = new byte[Math.min(8, fileBytes.length)];
        System.arraycopy(fileBytes, 0, header, 0, header.length);

        boolean match = switch (contentType) {
            case "application/pdf" ->
                // %PDF
                header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46;
            case "image/jpeg" ->
                (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;
            case "image/png" ->
                (header[0] & 0xFF) == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
            case "image/webp" ->
                // RIFF....WEBP
                header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46;
            case "application/msword" ->
                // D0 CF 11 E0
                (header[0] & 0xFF) == 0xD0 && (header[1] & 0xFF) == 0xCF
                    && (header[2] & 0xFF) == 0x11 && (header[3] & 0xFF) == 0xE0;
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ->
                // PK (ZIP)
                header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04;
            default -> false;
        };

        if (!match) {
            log.warn("Magic bytes não batem com Content-Type declarado: contentType={}, nome={}",
                contentType, file.getOriginalFilename());
            throw new BusinessException("Conteúdo do arquivo não corresponde ao tipo declarado");
        }
    }

    private Condominio validateCondominioAccess(UUID condominioId, User user) {
        Condominio condominio = condominioRepository.findById(condominioId)
            .filter(Condominio::isActive)
            .orElseThrow(() -> new BusinessException("Condomínio não encontrado"));

        switch (user.getRole()) {
            case ADMINISTRADORA:
                if (!condominio.getAdministradoraId().equals(user.getOrganizationId())) {
                    throw new BusinessException("Sem permissão para acessar este condomínio");
                }
                break;
            case SINDICO:
                if (!user.getId().equals(condominio.getSindicoId())) {
                    throw new BusinessException("Sem permissão para acessar este condomínio");
                }
                break;
            case CORRETORA:
            case ADMIN:
                // Acesso total
                break;
        }

        return condominio;
    }

    private Documento findDocumentoWithAccessCheck(UUID id, User user) {
        Documento documento = documentoRepository.findById(id)
            .filter(Documento::isActive)
            .orElseThrow(() -> new BusinessException("Documento não encontrado"));

        validateCondominioAccess(documento.getCondominioId(), user);
        return documento;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
    }

    // === Métodos de Comparação de Orçamentos ===

    @Transactional
    public DocumentoResponse updateOrcamentoData(UUID documentoId, UpdateOrcamentoDataRequest request) {
        User currentUser = getCurrentUser();
        Documento documento = findDocumentoWithAccessCheck(documentoId, currentUser);

        if (documento.getTipo() != TipoDocumento.ORCAMENTO) {
            throw new BusinessException("Documento não é um orçamento");
        }

        // Update basic fields
        documento.setSeguradoraNome(request.seguradoraNome());
        documento.setValorPremio(request.valorPremio());
        documento.setDataVigenciaInicio(request.dataVigenciaInicio());
        documento.setDataVigenciaFim(request.dataVigenciaFim());
        documento.setObservacoes(request.observacoes());

        // Convert DadosOrcamentoDTO to Map for JSONB storage
        if (request.dadosOrcamento() != null) {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> dadosMap = mapper.convertValue(request.dadosOrcamento(),
                new TypeReference<Map<String, Object>>() {});
            documento.setDadosExtraidos(dadosMap);
        }

        // Mark as processed (CONCLUIDO) since data was manually entered
        documento.setStatus(StatusProcessamento.CONCLUIDO);

        Documento saved = documentoRepository.save(documento);
        log.info("Orcamento data updated: id={}, seguradora={}, user={}",
            documentoId, request.seguradoraNome(), currentUser.getEmail());

        return documentoMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ComparacaoResultadoDTO compararOrcamentos(UUID condominioId, List<UUID> orcamentoIds) {
        User currentUser = getCurrentUser();
        validateCondominioAccess(condominioId, currentUser);

        if (orcamentoIds.size() < 2 || orcamentoIds.size() > 5) {
            throw new BusinessException("Selecione entre 2 e 5 orçamentos para comparação");
        }

        List<Documento> documentos = documentoRepository.findAllById(orcamentoIds);

        // Validate all documents belong to the condominio and are processed quotes
        for (Documento doc : documentos) {
            if (!doc.getCondominioId().equals(condominioId)) {
                throw new BusinessException("Orçamento não pertence a este condomínio: " + doc.getId());
            }
            if (doc.getTipo() != TipoDocumento.ORCAMENTO) {
                throw new BusinessException("Documento não é um orçamento: " + doc.getId());
            }
            if (doc.getStatus() != StatusProcessamento.CONCLUIDO) {
                throw new BusinessException("Orçamento não foi preenchido: " + doc.getNome());
            }
        }

        // Build comparison DTOs
        List<OrcamentoComparacaoDTO> orcamentos = documentos.stream()
            .map(this::toOrcamentoComparacaoDTO)
            .toList();

        // Generate comparison summary
        ComparacaoResumoDTO resumo = gerarResumoComparacao(orcamentos);

        return new ComparacaoResultadoDTO(orcamentos, resumo);
    }

    @SuppressWarnings("unchecked")
    private OrcamentoComparacaoDTO toOrcamentoComparacaoDTO(Documento doc) {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        DadosOrcamentoDTO dados = null;

        if (doc.getDadosExtraidos() != null) {
            try {
                // Tentar primeiro o sub-objeto dadosOrcamento (formato do PdfExtractionService)
                Object dadosOrcObj = doc.getDadosExtraidos().get("dadosOrcamento");
                if (dadosOrcObj instanceof Map) {
                    dados = mapper.convertValue(dadosOrcObj, DadosOrcamentoDTO.class);
                } else {
                    // Fallback: tentar converter o map inteiro (formato manual/antigo)
                    dados = mapper.convertValue(doc.getDadosExtraidos(), DadosOrcamentoDTO.class);
                }
            } catch (Exception e) {
                log.warn("Error converting dadosExtraidos for documento {}: {}", doc.getId(), e.getMessage());
                // Último fallback: montar manualmente a partir das coberturas no map
                try {
                    Object cobs = doc.getDadosExtraidos().get("coberturas");
                    if (cobs instanceof java.util.List) {
                        java.util.List<CoberturaDTO> coberturas = mapper.convertValue(cobs,
                            mapper.getTypeFactory().constructCollectionType(java.util.List.class, CoberturaDTO.class));
                        String formaPag = (String) doc.getDadosExtraidos().get("formaPagamento");
                        dados = new DadosOrcamentoDTO(coberturas, null, null, formaPag, null);
                    }
                } catch (Exception e2) {
                    log.warn("Fallback conversion also failed for documento {}: {}", doc.getId(), e2.getMessage());
                }
            }
        }

        int vigenciaDias = 0;
        if (doc.getDataVigenciaInicio() != null && doc.getDataVigenciaFim() != null) {
            vigenciaDias = (int) ChronoUnit.DAYS.between(
                doc.getDataVigenciaInicio(),
                doc.getDataVigenciaFim()
            );
        }

        return new OrcamentoComparacaoDTO(
            doc.getId(),
            doc.getNome(),
            doc.getSeguradoraNome(),
            doc.getValorPremio(),
            doc.getDataVigenciaInicio(),
            doc.getDataVigenciaFim(),
            vigenciaDias,
            dados != null && dados.coberturas() != null ? dados.coberturas() : List.of(),
            dados != null && dados.condicoesEspeciais() != null ? dados.condicoesEspeciais() : List.of(),
            dados != null ? dados.descontos() : null,
            dados != null ? dados.formaPagamento() : null,
            doc.getObservacoes(),
            doc.getDadosExtraidos()
        );
    }

    private ComparacaoResumoDTO gerarResumoComparacao(List<OrcamentoComparacaoDTO> orcamentos) {
        // Find lowest price
        OrcamentoComparacaoDTO menorPreco = orcamentos.stream()
            .filter(o -> o.valorPremio() != null)
            .min(Comparator.comparing(OrcamentoComparacaoDTO::valorPremio))
            .orElse(null);

        // Find highest total coverage
        OrcamentoComparacaoDTO maiorCobertura = orcamentos.stream()
            .max(Comparator.comparing(o ->
                o.coberturas().stream()
                    .filter(c -> c.valorLimite() != null)
                    .map(CoberturaDTO::valorLimite)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
            ))
            .orElse(null);

        BigDecimal maiorValorCobertura = maiorCobertura != null ?
            maiorCobertura.coberturas().stream()
                .filter(c -> c.valorLimite() != null)
                .map(CoberturaDTO::valorLimite)
                .reduce(BigDecimal.ZERO, BigDecimal::add) : null;

        // Find common coverages (present in all quotes)
        Set<String> coberturasComuns = new HashSet<>();
        if (!orcamentos.isEmpty() && !orcamentos.get(0).coberturas().isEmpty()) {
            coberturasComuns = orcamentos.get(0).coberturas().stream()
                .filter(CoberturaDTO::incluido)
                .map(CoberturaDTO::nome)
                .collect(Collectors.toSet());

            for (OrcamentoComparacaoDTO orc : orcamentos.subList(1, orcamentos.size())) {
                Set<String> coberturas = orc.coberturas().stream()
                    .filter(CoberturaDTO::incluido)
                    .map(CoberturaDTO::nome)
                    .collect(Collectors.toSet());
                coberturasComuns.retainAll(coberturas);
            }
        }

        // Find exclusive coverages per quote
        Map<UUID, List<String>> coberturasExclusivas = new HashMap<>();
        Set<String> finalCoberturasComuns = coberturasComuns;
        for (OrcamentoComparacaoDTO orc : orcamentos) {
            List<String> exclusivas = orc.coberturas().stream()
                .filter(CoberturaDTO::incluido)
                .map(CoberturaDTO::nome)
                .filter(nome -> !finalCoberturasComuns.contains(nome))
                .toList();
            if (!exclusivas.isEmpty()) {
                coberturasExclusivas.put(orc.id(), exclusivas);
            }
        }

        // Generate recommendations
        List<RecomendacaoDTO> recomendacoes = gerarRecomendacoes(orcamentos, menorPreco, maiorCobertura);

        return new ComparacaoResumoDTO(
            menorPreco != null ? menorPreco.id() : null,
            menorPreco != null ? menorPreco.seguradoraNome() : null,
            menorPreco != null ? menorPreco.valorPremio() : null,
            maiorCobertura != null ? maiorCobertura.id() : null,
            maiorCobertura != null ? maiorCobertura.seguradoraNome() : null,
            maiorValorCobertura,
            new ArrayList<>(coberturasComuns),
            coberturasExclusivas,
            recomendacoes
        );
    }

    private List<RecomendacaoDTO> gerarRecomendacoes(
        List<OrcamentoComparacaoDTO> orcamentos,
        OrcamentoComparacaoDTO menorPreco,
        OrcamentoComparacaoDTO maiorCobertura
    ) {
        List<RecomendacaoDTO> recomendacoes = new ArrayList<>();

        if (menorPreco != null) {
            recomendacoes.add(new RecomendacaoDTO(
                "MENOR_PRECO",
                menorPreco.id(),
                menorPreco.seguradoraNome(),
                "Oferece o menor valor de prêmio entre os orçamentos comparados."
            ));
        }

        if (maiorCobertura != null && (menorPreco == null || !maiorCobertura.id().equals(menorPreco.id()))) {
            recomendacoes.add(new RecomendacaoDTO(
                "MAIOR_COBERTURA",
                maiorCobertura.id(),
                maiorCobertura.seguradoraNome(),
                "Oferece o maior valor total de coberturas."
            ));
        }

        // Best cost-benefit (most coverage per R$)
        OrcamentoComparacaoDTO melhorCustoBeneficio = orcamentos.stream()
            .filter(o -> o.valorPremio() != null && o.valorPremio().compareTo(BigDecimal.ZERO) > 0)
            .max(Comparator.comparing(o -> {
                BigDecimal totalCobertura = o.coberturas().stream()
                    .filter(c -> c.valorLimite() != null)
                    .map(CoberturaDTO::valorLimite)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                if (totalCobertura.compareTo(BigDecimal.ZERO) == 0) {
                    return BigDecimal.ZERO;
                }
                return totalCobertura.divide(o.valorPremio(), 2, RoundingMode.HALF_UP);
            }))
            .orElse(null);

        if (melhorCustoBeneficio != null) {
            recomendacoes.add(new RecomendacaoDTO(
                "MELHOR_CUSTO_BENEFICIO",
                melhorCustoBeneficio.id(),
                melhorCustoBeneficio.seguradoraNome(),
                "Melhor relação entre valor do prêmio e cobertura total."
            ));
        }

        return recomendacoes;
    }
}
