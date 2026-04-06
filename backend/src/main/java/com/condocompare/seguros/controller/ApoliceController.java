package com.condocompare.seguros.controller;

import com.condocompare.seguros.dto.*;
import com.condocompare.seguros.entity.StatusApolice;
import com.condocompare.seguros.service.ApoliceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/apolices")
@RequiredArgsConstructor
@Tag(name = "Apólices", description = "Gestão de apólices de seguro")
@SecurityRequirement(name = "bearerAuth")
public class ApoliceController {

    private final ApoliceService apoliceService;

    @PostMapping
    @Operation(summary = "Criar nova apólice")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<ApoliceResponse> create(@Valid @RequestBody CreateApoliceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(apoliceService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar apólice")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<ApoliceResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateApoliceRequest request
    ) {
        return ResponseEntity.ok(apoliceService.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar apólice por ID")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApoliceResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(apoliceService.findById(id));
    }

    @GetMapping
    @Operation(summary = "Listar apólices com filtros e paginação")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<ApoliceListResponse>> findAll(
            @Parameter(description = "Busca por número da apólice, condomínio ou seguradora")
            @RequestParam(required = false) String search,

            @Parameter(description = "Filtrar por condomínio")
            @RequestParam(required = false) UUID condominioId,

            @Parameter(description = "Filtrar por seguradora")
            @RequestParam(required = false) UUID seguradoraId,

            @Parameter(description = "Filtrar por status")
            @RequestParam(required = false) StatusApolice status,

            @Parameter(description = "Filtrar apenas vigentes")
            @RequestParam(required = false) Boolean vigente,

            @Parameter(description = "Filtrar apólices vencendo")
            @RequestParam(required = false) Boolean vencendo,

            @Parameter(description = "Dias para vencimento (padrão: 30)")
            @RequestParam(required = false) Integer diasVencimento,

            @PageableDefault(size = 20, sort = "dataFim", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        ApoliceFilter filter = new ApoliceFilter(
            search, condominioId, seguradoraId, status, vigente, vencendo, diasVencimento
        );
        return ResponseEntity.ok(apoliceService.findAll(filter, pageable));
    }

    @GetMapping("/condominio/{condominioId}")
    @Operation(summary = "Listar apólices de um condomínio")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ApoliceListResponse>> findByCondominio(@PathVariable UUID condominioId) {
        return ResponseEntity.ok(apoliceService.findByCondominio(condominioId));
    }

    @GetMapping("/condominio/{condominioId}/vigente")
    @Operation(summary = "Buscar apólice vigente de um condomínio")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApoliceResponse> findVigenteByCondominio(@PathVariable UUID condominioId) {
        ApoliceResponse apolice = apoliceService.findVigenteByCondominio(condominioId);
        return apolice != null ? ResponseEntity.ok(apolice) : ResponseEntity.notFound().build();
    }

    @GetMapping("/vencendo")
    @Operation(summary = "Listar apólices vencendo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ApoliceListResponse>> findVencendo(
            @Parameter(description = "Dias para vencimento (padrão: 30)")
            @RequestParam(defaultValue = "30") int dias
    ) {
        return ResponseEntity.ok(apoliceService.findVencendo(dias));
    }

    @GetMapping("/vencidas")
    @Operation(summary = "Listar apólices vencidas")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ApoliceListResponse>> findVencidas() {
        return ResponseEntity.ok(apoliceService.findVencidas());
    }

    @PostMapping("/{id}/coberturas")
    @Operation(summary = "Adicionar cobertura à apólice")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<CoberturaResponse> addCobertura(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCoberturaRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(apoliceService.addCobertura(id, request));
    }

    @DeleteMapping("/{id}/coberturas/{coberturaId}")
    @Operation(summary = "Remover cobertura da apólice")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<Void> removeCobertura(
            @PathVariable UUID id,
            @PathVariable UUID coberturaId
    ) {
        apoliceService.removeCobertura(id, coberturaId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/coberturas")
    @Operation(summary = "Listar coberturas da apólice")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CoberturaResponse>> findCoberturas(@PathVariable UUID id) {
        return ResponseEntity.ok(apoliceService.findCoberturasByApolice(id));
    }

    @PostMapping("/{id}/renovar")
    @Operation(summary = "Iniciar renovação da apólice")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<ApoliceResponse> renovar(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(apoliceService.renovar(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir apólice (soft delete)")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        apoliceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
