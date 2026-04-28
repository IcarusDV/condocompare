package com.condocompare.parceiros.controller;

import com.condocompare.parceiros.dto.*;
import com.condocompare.parceiros.entity.CategoriaParceiro;
import com.condocompare.parceiros.service.ParceiroService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/parceiros")
public class ParceiroController {

    private final ParceiroService parceiroService;

    public ParceiroController(ParceiroService parceiroService) {
        this.parceiroService = parceiroService;
    }

    @PostMapping
    public ResponseEntity<ParceiroResponse> create(@Valid @RequestBody CreateParceiroRequest request) {
        ParceiroResponse response = parceiroService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParceiroResponse> getById(@PathVariable UUID id) {
        ParceiroResponse response = parceiroService.getById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ParceiroResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateParceiroRequest request
    ) {
        ParceiroResponse response = parceiroService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        parceiroService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<ParceiroListResponse>> list(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) CategoriaParceiro categoria,
        @RequestParam(required = false) String cidade,
        @RequestParam(required = false) String estado,
        @RequestParam(required = false) Boolean ativo,
        @RequestParam(required = false) Boolean verificado,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "nome") String sort
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(sort));
        Page<ParceiroListResponse> response = parceiroService.list(
            search, categoria, cidade, estado, ativo, verificado, pageable
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/ativar")
    public ResponseEntity<Void> activate(@PathVariable UUID id) {
        parceiroService.activate(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/desativar")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        parceiroService.deactivate(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/verificar")
    public ResponseEntity<Void> verify(@PathVariable UUID id) {
        parceiroService.verify(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<ParceiroListResponse>> findByCategoria(
        @PathVariable CategoriaParceiro categoria
    ) {
        List<ParceiroListResponse> response = parceiroService.findByCategoria(categoria);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/categoria/{categoria}/cidade/{cidade}")
    public ResponseEntity<List<ParceiroListResponse>> findByCategoriaAndCidade(
        @PathVariable CategoriaParceiro categoria,
        @PathVariable String cidade
    ) {
        List<ParceiroListResponse> response = parceiroService.findByCategoriaAndCidade(categoria, cidade);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/categoria/{categoria}/estado/{estado}")
    public ResponseEntity<List<ParceiroListResponse>> findByCategoriaAndEstado(
        @PathVariable CategoriaParceiro categoria,
        @PathVariable String estado
    ) {
        List<ParceiroListResponse> response = parceiroService.findByCategoriaAndEstado(categoria, estado);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/top-rated")
    public ResponseEntity<List<ParceiroListResponse>> findTopRated(
        @RequestParam(defaultValue = "10") int limit
    ) {
        List<ParceiroListResponse> response = parceiroService.findTopRated(limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/top-rated/categoria/{categoria}")
    public ResponseEntity<List<ParceiroListResponse>> findTopRatedByCategoria(
        @PathVariable CategoriaParceiro categoria,
        @RequestParam(defaultValue = "10") int limit
    ) {
        List<ParceiroListResponse> response = parceiroService.findTopRatedByCategoria(categoria, limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats/categorias")
    public ResponseEntity<Map<CategoriaParceiro, Long>> countByCategoria() {
        Map<CategoriaParceiro, Long> response = parceiroService.countByCategoria();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaResponse>> getCategorias() {
        List<CategoriaResponse> response = parceiroService.getCategorias().stream()
            .map(c -> new CategoriaResponse(c.name(), c.getDescricao()))
            .toList();
        return ResponseEntity.ok(response);
    }

    public record CategoriaResponse(String codigo, String descricao) {}

    public record OfertaIaRequest(UUID condominioId) {}
    public record OfertaIaResponse(String texto) {}

    @PostMapping("/{id}/oferta-ia")
    public ResponseEntity<OfertaIaResponse> gerarOfertaIa(
        @PathVariable UUID id,
        @RequestBody OfertaIaRequest request
    ) {
        String texto = parceiroService.gerarOfertaComIA(id, request.condominioId());
        return ResponseEntity.ok(new OfertaIaResponse(texto));
    }
}
