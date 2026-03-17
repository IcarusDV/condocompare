package com.condocompare.ia.service;

import com.condocompare.common.exception.BusinessException;
import com.condocompare.ia.dto.*;
import com.condocompare.ia.entity.ChatConversation;
import com.condocompare.ia.entity.ChatMessage;
import com.condocompare.ia.repository.ChatConversationRepository;
import com.condocompare.ia.repository.ChatMessageRepository;
import com.condocompare.users.entity.User;
import com.condocompare.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatHistoryService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> listConversations() {
        User user = getCurrentUser();
        List<ChatConversation> conversations = conversationRepository
                .findByUserIdAndActiveTrueOrderByUpdatedAtDesc(user.getId());

        return conversations.stream().map(conv -> {
            int msgCount = messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId()).size();
            return new ChatConversationResponse(
                    conv.getId(),
                    conv.getTitulo(),
                    conv.getContextType(),
                    conv.getCondominioId(),
                    conv.getCreatedAt(),
                    conv.getUpdatedAt(),
                    msgCount
            );
        }).toList();
    }

    @Transactional
    public ChatConversationResponse createConversation(CreateConversationRequest request) {
        User user = getCurrentUser();

        ChatConversation conversation = ChatConversation.builder()
                .userId(user.getId())
                .titulo(request.titulo())
                .contextType(request.contextType() != null ? request.contextType() : "geral")
                .condominioId(request.condominioId())
                .active(true)
                .build();

        conversation = conversationRepository.save(conversation);
        log.info("Conversa criada: id={}, userId={}", conversation.getId(), user.getId());

        return new ChatConversationResponse(
                conversation.getId(),
                conversation.getTitulo(),
                conversation.getContextType(),
                conversation.getCondominioId(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt(),
                0
        );
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(UUID conversationId) {
        User user = getCurrentUser();
        ChatConversation conversation = getConversationWithAccess(conversationId, user);

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
                .stream()
                .map(msg -> new ChatMessageResponse(
                        msg.getId(),
                        msg.getRole(),
                        msg.getContent(),
                        msg.getSources(),
                        msg.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public ChatMessageResponse addMessage(UUID conversationId, AddMessageRequest request) {
        User user = getCurrentUser();
        ChatConversation conversation = getConversationWithAccess(conversationId, user);

        ChatMessage message = ChatMessage.builder()
                .conversationId(conversation.getId())
                .role(request.role())
                .content(request.content())
                .sources(request.sources())
                .build();

        message = messageRepository.save(message);

        // Auto-set title from first user message
        if (conversation.getTitulo() == null || conversation.getTitulo().isBlank()) {
            if ("user".equals(request.role())) {
                String titulo = request.content().length() > 80
                        ? request.content().substring(0, 80) + "..."
                        : request.content();
                conversation.setTitulo(titulo);
                conversationRepository.save(conversation);
            }
        } else {
            // Touch updatedAt
            conversationRepository.save(conversation);
        }

        return new ChatMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                message.getSources(),
                message.getCreatedAt()
        );
    }

    @Transactional
    public void updateTitle(UUID conversationId, String titulo) {
        User user = getCurrentUser();
        ChatConversation conversation = getConversationWithAccess(conversationId, user);
        conversation.setTitulo(titulo);
        conversationRepository.save(conversation);
    }

    @Transactional
    public void deleteConversation(UUID conversationId) {
        User user = getCurrentUser();
        ChatConversation conversation = getConversationWithAccess(conversationId, user);
        conversation.setActive(false);
        conversationRepository.save(conversation);
        log.info("Conversa deletada: id={}, userId={}", conversationId, user.getId());
    }

    private ChatConversation getConversationWithAccess(UUID conversationId, User user) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .filter(ChatConversation::isActive)
                .orElseThrow(() -> new BusinessException("Conversa não encontrada"));

        if (!conversation.getUserId().equals(user.getId())) {
            throw new BusinessException("Sem permissão para acessar esta conversa");
        }

        return conversation;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
    }
}
