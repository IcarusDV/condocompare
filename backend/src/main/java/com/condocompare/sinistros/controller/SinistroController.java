package com.condocompare.sinistros.controller;

import com.condocompare.sinistros.dto.*;
import com.condocompare.sinistros.entity.StatusSinistro;
import com.condocompare.sinistros.entity.TipoSinistro;
import com.condocompare.sinistros.service.SinistroService;
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
@RequestMapping("/v1/sinistros")
@RequiredArgsConstructor
@Tag(name = "Sinistros", description = "Gerenciamento de sinistros")
public class SinistroController {

    private final SinistroService sinistroService;

    @PostMapping
    @Operation(summary = "Registrar novo sinistro")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<SinistroResponse> create(@Valid @RequestBody CreateSinistroRequest request) {
        return ResponseEntity.ok(sinistroService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar sinistro")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<SinistroResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateSinistroRequest request
    ) {
        return ResponseEntity.ok(sinistroService.update(id, request));
    }

    @PostMapping("/{id}/historico")
    @Operation(summary = "Adicionar evento ao histórico do sinistro")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<SinistroResponse> addHistorico(
        @PathVariable UUID id,
        @Valid @RequestBody AddHistoricoRequest request
    ) {
        return ResponseEntity.ok(sinistroService.addHistorico(id, request));
    }

    // ============================================================
    // ROTAS LITERAIS (devem vir ANTES das rotas com path variable)
    // ============================================================

    @GetMapping
    @Operation(summary = "Listar sinistros com filtros")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<Page<SinistroListResponse>> findAll(
        @RequestParam(required = false) UUID condominioId,
        @RequestParam(required = false) TipoSinistro tipo,
        @RequestParam(required = false) StatusSinistro status,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(sinistroService.findAll(condominioId, tipo, status, pageable));
    }

    @GetMapping("/stats")
    @Operation(summary = "Estatísticas de sinistros")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<SinistroStatsResponse> getStats() {
        return ResponseEntity.ok(sinistroService.getStats());
    }

    @GetMapping("/tipos")
    @Operation(summary = "Listar tipos de sinistro")
    public ResponseEntity<TipoSinistro[]> getTipos() {
        return ResponseEntity.ok(TipoSinistro.values());
    }

    @GetMapping("/status")
    @Operation(summary = "Listar status de sinistro")
    public ResponseEntity<StatusSinistro[]> getStatus() {
        return ResponseEntity.ok(StatusSinistro.values());
    }

    @GetMapping("/condominio/{condominioId}")
    @Operation(summary = "Listar sinistros de um condomínio")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<List<SinistroListResponse>> findByCondominio(@PathVariable UUID condominioId) {
        return ResponseEntity.ok(sinistroService.findByCondominio(condominioId));
    }

    // ============================================================
    // ROTAS COM PATH VARIABLE (devem vir DEPOIS das literais)
    // ============================================================

    @GetMapping("/{id}")
    @Operation(summary = "Buscar sinistro por ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA', 'SINDICO')")
    public ResponseEntity<SinistroResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(sinistroService.findById(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar sinistro (soft delete)")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        sinistroService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
