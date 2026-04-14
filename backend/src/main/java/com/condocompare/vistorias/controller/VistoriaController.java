package com.condocompare.vistorias.controller;

import com.condocompare.vistorias.dto.*;
import com.condocompare.vistorias.entity.StatusVistoria;
import com.condocompare.vistorias.entity.TipoVistoria;
import com.condocompare.vistorias.entity.VistoriaItem;
import com.condocompare.vistorias.entity.VistoriaFoto;
import com.condocompare.vistorias.service.VistoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/vistorias")
@RequiredArgsConstructor
@Tag(name = "Vistorias", description = "Gerenciamento de vistorias")
public class VistoriaController {

    private final VistoriaService vistoriaService;

    // ============================================================
    // ROTAS LITERAIS E DE CRIAÇÃO
    // ============================================================

    @PostMapping
    @Operation(summary = "Criar nova vistoria")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<VistoriaResponse> create(@Valid @RequestBody CreateVistoriaRequest request) {
        return ResponseEntity.ok(vistoriaService.create(request));
    }

    @GetMapping
    @Operation(summary = "Listar vistorias com filtros")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<VistoriaListResponse>> findAll(
        @RequestParam(required = false) UUID condominioId,
        @RequestParam(required = false) TipoVistoria tipo,
        @RequestParam(required = false) StatusVistoria status,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(vistoriaService.findAll(condominioId, tipo, status, pageable));
    }

    @GetMapping("/tipos")
    @Operation(summary = "Listar tipos de vistoria")
    public ResponseEntity<TipoVistoria[]> getTipos() {
        return ResponseEntity.ok(TipoVistoria.values());
    }

    @GetMapping("/status")
    @Operation(summary = "Listar status de vistoria")
    public ResponseEntity<StatusVistoria[]> getStatus() {
        return ResponseEntity.ok(StatusVistoria.values());
    }

    @GetMapping("/condominio/{condominioId}")
    @Operation(summary = "Listar vistorias de um condomínio")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<List<VistoriaListResponse>> findByCondominio(@PathVariable UUID condominioId) {
        return ResponseEntity.ok(vistoriaService.findByCondominio(condominioId));
    }

    @GetMapping("/external/{token}")
    @Operation(summary = "Acesso externo a vistoria (publico, sem autenticacao)")
    public ResponseEntity<ExternalVistoriaResponse> findByExternalToken(@PathVariable String token) {
        return ResponseEntity.ok(vistoriaService.findBySharedToken(token));
    }

    // ============================================================
    // ROTAS COM PATH VARIABLE /{id}
    // ============================================================

    @GetMapping("/{id}")
    @Operation(summary = "Buscar vistoria por ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<VistoriaResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(vistoriaService.findById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar vistoria")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<VistoriaResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateVistoriaRequest request
    ) {
        return ResponseEntity.ok(vistoriaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar vistoria (soft delete)")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        vistoriaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/generate-link")
    @Operation(summary = "Gerar link externo para vistoria")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<SharedLinkResponse> generateLink(@PathVariable UUID id) {
        return ResponseEntity.ok(vistoriaService.generateSharedLink(id));
    }

    @DeleteMapping("/{id}/revoke-link")
    @Operation(summary = "Revogar link externo da vistoria")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<Void> revokeLink(@PathVariable UUID id) {
        vistoriaService.revokeSharedLink(id);
        return ResponseEntity.noContent().build();
    }

    // ===== Checklist Items =====

    @GetMapping("/{id}/itens")
    @Operation(summary = "Listar itens do checklist da vistoria")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<VistoriaItem>> getItens(@PathVariable UUID id) {
        return ResponseEntity.ok(vistoriaService.getItens(id));
    }

    @PostMapping("/{id}/itens")
    @Operation(summary = "Adicionar item ao checklist")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<VistoriaItem> addItem(
        @PathVariable UUID id,
        @RequestBody VistoriaItem item
    ) {
        item.setVistoriaId(id);
        return ResponseEntity.ok(vistoriaService.addItem(item));
    }

    @PutMapping("/{id}/itens/{itemId}")
    @Operation(summary = "Atualizar item do checklist")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<VistoriaItem> updateItem(
        @PathVariable UUID id,
        @PathVariable UUID itemId,
        @RequestBody VistoriaItem item
    ) {
        item.setId(itemId);
        item.setVistoriaId(id);
        return ResponseEntity.ok(vistoriaService.updateItem(item));
    }

    @DeleteMapping("/{id}/itens/{itemId}")
    @Operation(summary = "Remover item do checklist")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<Void> deleteItem(@PathVariable UUID id, @PathVariable UUID itemId) {
        vistoriaService.deleteItem(itemId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/itens/checklist-padrao")
    @Operation(summary = "Carregar checklist padrao para a vistoria")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<List<VistoriaItem>> loadDefaultChecklist(@PathVariable UUID id) {
        return ResponseEntity.ok(vistoriaService.loadDefaultChecklist(id));
    }

    // ===== Fotos =====

    @GetMapping("/{id}/fotos")
    @Operation(summary = "Listar fotos da vistoria")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<VistoriaFoto>> getFotos(@PathVariable UUID id) {
        return ResponseEntity.ok(vistoriaService.getFotos(id));
    }

    @PostMapping("/{id}/fotos")
    @Operation(summary = "Adicionar foto a vistoria")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<VistoriaFoto> addFoto(
        @PathVariable UUID id,
        @RequestBody VistoriaFoto foto
    ) {
        foto.setVistoriaId(id);
        return ResponseEntity.ok(vistoriaService.addFoto(foto));
    }

    @DeleteMapping("/{id}/fotos/{fotoId}")
    @Operation(summary = "Remover foto da vistoria")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<Void> deleteFoto(@PathVariable UUID id, @PathVariable UUID fotoId) {
        vistoriaService.deleteFoto(fotoId);
        return ResponseEntity.noContent().build();
    }

    // ===== Laudo =====

    @PostMapping("/{id}/gerar-laudo")
    @Operation(summary = "Gerar laudo tecnico via IA")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<VistoriaResponse> gerarLaudo(@PathVariable UUID id) {
        return ResponseEntity.ok(vistoriaService.gerarLaudo(id));
    }
}
