package com.condocompare.seguros.controller;

import com.condocompare.seguros.dto.CreateSeguradoraRequest;
import com.condocompare.seguros.dto.SeguradoraResponse;
import com.condocompare.seguros.dto.SeguradoraStatsResponse;
import com.condocompare.seguros.service.SeguradoraService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/seguradoras")
@RequiredArgsConstructor
@Tag(name = "Seguradoras", description = "Gestão de seguradoras")
@SecurityRequirement(name = "bearerAuth")
public class SeguradoraController {

    private final SeguradoraService seguradoraService;

    @PostMapping
    @Operation(summary = "Criar nova seguradora")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<SeguradoraResponse> create(@Valid @RequestBody CreateSeguradoraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(seguradoraService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar seguradora")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<SeguradoraResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateSeguradoraRequest request
    ) {
        return ResponseEntity.ok(seguradoraService.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar seguradora por ID")
    public ResponseEntity<SeguradoraResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(seguradoraService.findById(id));
    }

    @GetMapping
    @Operation(summary = "Listar todas as seguradoras")
    public ResponseEntity<List<SeguradoraResponse>> findAll() {
        return ResponseEntity.ok(seguradoraService.findAll());
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar seguradoras por nome")
    public ResponseEntity<List<SeguradoraResponse>> search(@RequestParam String nome) {
        return ResponseEntity.ok(seguradoraService.search(nome));
    }

    @GetMapping("/{id}/stats")
    @Operation(summary = "Obter estatísticas da seguradora")
    public ResponseEntity<SeguradoraStatsResponse> getStats(@PathVariable UUID id) {
        return ResponseEntity.ok(seguradoraService.getStats(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir seguradora (soft delete)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        seguradoraService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/condicoes-gerais", consumes = "multipart/form-data")
    @Operation(summary = "Upload das Condições Gerais (PDF) da seguradora")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<SeguradoraResponse> uploadCondicoesGerais(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(seguradoraService.uploadCondicoesGerais(id, file));
    }

    @DeleteMapping("/{id}/condicoes-gerais")
    @Operation(summary = "Remover Condições Gerais da seguradora")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<SeguradoraResponse> removerCondicoesGerais(@PathVariable UUID id) {
        return ResponseEntity.ok(seguradoraService.removerCondicoesGerais(id));
    }
}
