package com.condocompare.ia.controller;

import com.condocompare.ia.dto.*;
import com.condocompare.ia.service.ChatHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/chat")
@RequiredArgsConstructor
@Tag(name = "Chat History", description = "Histórico de conversas do assistente IA")
@SecurityRequirement(name = "bearerAuth")
public class ChatHistoryController {

    private final ChatHistoryService chatHistoryService;

    @GetMapping("/conversations")
    @Operation(summary = "Listar conversas", description = "Lista todas as conversas do usuário")
    public ResponseEntity<List<ChatConversationResponse>> listConversations() {
        return ResponseEntity.ok(chatHistoryService.listConversations());
    }

    @PostMapping("/conversations")
    @Operation(summary = "Criar conversa", description = "Cria uma nova conversa")
    public ResponseEntity<ChatConversationResponse> createConversation(
            @RequestBody CreateConversationRequest request) {
        return ResponseEntity.ok(chatHistoryService.createConversation(request));
    }

    @GetMapping("/conversations/{id}/messages")
    @Operation(summary = "Listar mensagens", description = "Lista mensagens de uma conversa")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable UUID id) {
        return ResponseEntity.ok(chatHistoryService.getMessages(id));
    }

    @PostMapping("/conversations/{id}/messages")
    @Operation(summary = "Adicionar mensagem", description = "Adiciona mensagem a uma conversa")
    public ResponseEntity<ChatMessageResponse> addMessage(
            @PathVariable UUID id,
            @Valid @RequestBody AddMessageRequest request) {
        return ResponseEntity.ok(chatHistoryService.addMessage(id, request));
    }

    @PutMapping("/conversations/{id}")
    @Operation(summary = "Atualizar titulo", description = "Atualiza o título de uma conversa")
    public ResponseEntity<Void> updateTitle(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        chatHistoryService.updateTitle(id, body.get("titulo"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/conversations/{id}")
    @Operation(summary = "Deletar conversa", description = "Deleta uma conversa e suas mensagens")
    public ResponseEntity<Void> deleteConversation(@PathVariable UUID id) {
        chatHistoryService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }
}
