package com.condocompare.condominios.controller;

import com.condocompare.condominios.dto.*;
import com.condocompare.condominios.entity.TipoConstrucao;
import com.condocompare.condominios.service.CondominioService;
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
@RequestMapping("/v1/condominios")
@RequiredArgsConstructor
@Tag(name = "Condomínios", description = "Gestão de condomínios")
@SecurityRequirement(name = "bearerAuth")
public class CondominioController {

    private final CondominioService condominioService;

    @PostMapping
    @Operation(summary = "Criar novo condomínio")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<CondominioResponse> create(@Valid @RequestBody CreateCondominioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(condominioService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar condomínio")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<CondominioResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCondominioRequest request
    ) {
        return ResponseEntity.ok(condominioService.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar condomínio por ID")
    public ResponseEntity<CondominioResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(condominioService.findById(id));
    }

    @GetMapping
    @Operation(summary = "Listar condomínios com filtros e paginação")
    public ResponseEntity<Page<CondominioListResponse>> findAll(
            @Parameter(description = "Busca por nome, CNPJ ou cidade")
            @RequestParam(required = false) String search,

            @Parameter(description = "Filtrar por cidade")
            @RequestParam(required = false) String cidade,

            @Parameter(description = "Filtrar por estado (UF)")
            @RequestParam(required = false) String estado,

            @Parameter(description = "Filtrar por tipo de construção")
            @RequestParam(required = false) TipoConstrucao tipoConstrucao,

            @Parameter(description = "Filtrar apólices vencendo nos próximos 30 dias")
            @RequestParam(required = false) Boolean apoliceVencendo,

            @Parameter(description = "Filtrar apólices vencidas")
            @RequestParam(required = false) Boolean apoliceVencida,

            @Parameter(description = "Filtrar por seguradora")
            @RequestParam(required = false) String seguradora,

            @PageableDefault(size = 20, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        CondominioFilter filter = new CondominioFilter(
            search, cidade, estado, tipoConstrucao, apoliceVencendo, apoliceVencida, seguradora
        );
        return ResponseEntity.ok(condominioService.findAll(filter, pageable));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir condomínio (soft delete)")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        condominioService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/vencendo")
    @Operation(summary = "Listar condomínios com apólice vencendo")
    public ResponseEntity<List<CondominioListResponse>> findVencendo(
            @Parameter(description = "Dias para vencimento (padrão: 30)")
            @RequestParam(defaultValue = "30") int dias
    ) {
        return ResponseEntity.ok(condominioService.findCondominiosVencendo(dias));
    }

    @GetMapping("/vencidos")
    @Operation(summary = "Listar condomínios com apólice vencida")
    public ResponseEntity<List<CondominioListResponse>> findVencidos() {
        return ResponseEntity.ok(condominioService.findCondominiosVencidos());
    }

    @PostMapping("/{id}/sindico/{sindicoId}")
    @Operation(summary = "Vincular síndico ao condomínio")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA', 'ADMINISTRADORA')")
    public ResponseEntity<CondominioResponse> vincularSindico(
            @PathVariable UUID id,
            @PathVariable UUID sindicoId
    ) {
        return ResponseEntity.ok(condominioService.vincularSindico(id, sindicoId));
    }

    @PostMapping("/{id}/administradora")
    @Operation(summary = "Vincular administradora ao condomínio")
    @PreAuthorize("hasAnyRole('ADMIN', 'CORRETORA')")
    public ResponseEntity<CondominioResponse> vincularAdministradora(
            @PathVariable UUID id,
            @RequestBody VincularAdministradoraRequest request
    ) {
        return ResponseEntity.ok(condominioService.vincularAdministradora(
            id, request.administradoraId(), request.administradoraNome()
        ));
    }

    public record VincularAdministradoraRequest(UUID administradoraId, String administradoraNome) {}
}
