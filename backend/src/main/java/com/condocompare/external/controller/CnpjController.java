package com.condocompare.external.controller;

import com.condocompare.external.dto.CnpjResponse;
import com.condocompare.external.service.CnpjService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/cnpj")
@RequiredArgsConstructor
@Tag(name = "CNPJ", description = "Consulta publica de CNPJ na Receita Federal (BrasilAPI)")
public class CnpjController {

    private final CnpjService cnpjService;

    @GetMapping("/{cnpj}")
    @Operation(summary = "Consulta dados publicos de um CNPJ")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CnpjResponse> buscar(@PathVariable String cnpj) {
        return ResponseEntity.ok(cnpjService.buscar(cnpj));
    }
}
