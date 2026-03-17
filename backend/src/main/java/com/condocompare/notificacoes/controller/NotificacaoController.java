package com.condocompare.notificacoes.controller;

import com.condocompare.notificacoes.dto.NotificacaoResponse;
import com.condocompare.notificacoes.service.NotificacaoService;
import com.condocompare.notificacoes.service.VencimentoApoliceScheduler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/notificacoes")
@RequiredArgsConstructor
@Tag(name = "Notificacoes", description = "Gerenciamento de notificacoes")
public class NotificacaoController {

    private final NotificacaoService notificacaoService;
    private final VencimentoApoliceScheduler vencimentoScheduler;

    @GetMapping
    @Operation(summary = "Listar notificacoes do usuario")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<NotificacaoResponse>> getNotificacoes(
        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(notificacaoService.getNotificacoes(pageable));
    }

    @GetMapping("/nao-lidas")
    @Operation(summary = "Listar notificacoes nao lidas")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificacaoResponse>> getNaoLidas() {
        return ResponseEntity.ok(notificacaoService.getNaoLidas());
    }

    @GetMapping("/count")
    @Operation(summary = "Contar notificacoes nao lidas")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> countNaoLidas() {
        return ResponseEntity.ok(Map.of("count", notificacaoService.countNaoLidas()));
    }

    @PutMapping("/{id}/lida")
    @Operation(summary = "Marcar notificacao como lida")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificacaoResponse> marcarComoLida(@PathVariable UUID id) {
        return ResponseEntity.ok(notificacaoService.marcarComoLida(id));
    }

    @PutMapping("/marcar-todas-lidas")
    @Operation(summary = "Marcar todas notificacoes como lidas")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> marcarTodasComoLidas() {
        notificacaoService.marcarTodasComoLidas();
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar notificacao")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        notificacaoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verificar-vencimentos")
    @Operation(summary = "Verificar vencimentos de apolices manualmente (Admin)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> verificarVencimentos() {
        vencimentoScheduler.verificarManualmente();
        return ResponseEntity.ok(Map.of("message", "Verificacao de vencimentos executada"));
    }
}
