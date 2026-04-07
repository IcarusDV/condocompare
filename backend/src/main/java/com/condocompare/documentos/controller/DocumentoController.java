package com.condocompare.documentos.controller;

import com.condocompare.documentos.dto.*;
import com.condocompare.documentos.entity.StatusProcessamento;
import com.condocompare.documentos.entity.TipoDocumento;
import com.condocompare.documentos.service.DocumentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/documentos")
@RequiredArgsConstructor
@Tag(name = "Documentos", description = "Gerenciamento de documentos")
public class DocumentoController {

    private final DocumentoService documentoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload de documento")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<DocumentoResponse> upload(
        @RequestPart("file") MultipartFile file,
        @RequestParam("condominioId") String condominioId,
        @RequestParam("tipo") String tipo,
        @RequestParam("nome") String nome,
        @RequestParam(value = "observacoes", required = false) String observacoes,
        @RequestParam(value = "seguradoraNome", required = false) String seguradoraNome
    ) {
        UploadDocumentoRequest request = new UploadDocumentoRequest(
            UUID.fromString(condominioId),
            TipoDocumento.valueOf(tipo),
            nome,
            observacoes,
            seguradoraNome
        );

        DocumentoResponse response = documentoService.upload(file, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar documento por ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<DocumentoResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(documentoService.findById(id));
    }

    @GetMapping
    @Operation(summary = "Listar documentos com filtros")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<Page<DocumentoListResponse>> findAll(
        @RequestParam(required = false) UUID condominioId,
        @RequestParam(required = false) TipoDocumento tipo,
        @RequestParam(required = false) StatusProcessamento status,
        @RequestParam(required = false) String seguradora,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        DocumentoFilter filter = new DocumentoFilter(condominioId, tipo, status, seguradora, search);
        return ResponseEntity.ok(documentoService.findAll(filter, pageable));
    }

    @GetMapping("/condominio/{condominioId}")
    @Operation(summary = "Listar documentos de um condomínio")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<List<DocumentoListResponse>> findByCondominio(@PathVariable UUID condominioId) {
        return ResponseEntity.ok(documentoService.findByCondominio(condominioId));
    }

    @GetMapping("/condominio/{condominioId}/tipo/{tipo}")
    @Operation(summary = "Listar documentos de um condomínio por tipo")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<List<DocumentoListResponse>> findByCondominioAndTipo(
        @PathVariable UUID condominioId,
        @PathVariable TipoDocumento tipo
    ) {
        return ResponseEntity.ok(documentoService.findByCondominioAndTipo(condominioId, tipo));
    }

    @GetMapping("/condominio/{condominioId}/orcamentos")
    @Operation(summary = "Listar orçamentos processados para comparação")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<List<DocumentoListResponse>> findOrcamentosParaComparacao(
        @PathVariable UUID condominioId
    ) {
        return ResponseEntity.ok(documentoService.findOrcamentosParaComparacao(condominioId));
    }

    @GetMapping("/{id}/download-url")
    @Operation(summary = "Obter URL temporária para download")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<Map<String, String>> getDownloadUrl(@PathVariable UUID id) {
        String url = documentoService.getDownloadUrl(id);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download direto do documento")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<InputStreamResource> download(@PathVariable UUID id) {
        DocumentoResponse doc = documentoService.findById(id);
        InputStream inputStream = documentoService.download(id);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.nomeArquivo() + "\"")
            .contentType(MediaType.parseMediaType(doc.mimeType() != null ? doc.mimeType() : "application/octet-stream"))
            .body(new InputStreamResource(inputStream));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar metadados do documento")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<DocumentoResponse> updateDocumento(
        @PathVariable UUID id,
        @RequestBody UpdateDocumentoRequest request
    ) {
        return ResponseEntity.ok(documentoService.updateDocumento(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar documento (soft delete)")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        documentoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tipos")
    @Operation(summary = "Listar tipos de documentos disponíveis")
    public ResponseEntity<TipoDocumento[]> getTipos() {
        return ResponseEntity.ok(TipoDocumento.values());
    }

    @PostMapping("/{id}/reprocess")
    @Operation(summary = "Reprocessar documento com erro")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<DocumentoResponse> reprocess(@PathVariable UUID id) {
        return ResponseEntity.ok(documentoService.reprocess(id));
    }

    // === Endpoints de Comparação de Orçamentos ===

    @PutMapping("/{id}/orcamento-data")
    @Operation(summary = "Atualizar dados estruturados do orçamento")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<DocumentoResponse> updateOrcamentoData(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateOrcamentoDataRequest request
    ) {
        return ResponseEntity.ok(documentoService.updateOrcamentoData(id, request));
    }

    @PostMapping("/condominio/{condominioId}/comparar")
    @Operation(summary = "Comparar orçamentos selecionados")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<ComparacaoResultadoDTO> compararOrcamentos(
        @PathVariable UUID condominioId,
        @RequestBody List<UUID> orcamentoIds
    ) {
        return ResponseEntity.ok(documentoService.compararOrcamentos(condominioId, orcamentoIds));
    }
}
