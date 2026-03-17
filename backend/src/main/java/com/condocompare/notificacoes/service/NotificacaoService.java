package com.condocompare.notificacoes.service;

import com.condocompare.common.exception.BusinessException;
import com.condocompare.common.exception.ResourceNotFoundException;
import com.condocompare.notificacoes.dto.NotificacaoResponse;
import com.condocompare.notificacoes.entity.Notificacao;
import com.condocompare.notificacoes.entity.TipoNotificacao;
import com.condocompare.notificacoes.repository.NotificacaoRepository;
import com.condocompare.users.entity.User;
import com.condocompare.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;
    private final UserRepository userRepository;

    @Transactional
    public void criarNotificacao(UUID userId, TipoNotificacao tipo, String titulo, String mensagem,
                                  String referenciaTipo, UUID referenciaId) {
        Notificacao notificacao = Notificacao.builder()
            .userId(userId)
            .tipo(tipo)
            .titulo(titulo)
            .mensagem(mensagem)
            .lida(false)
            .referenciaTipo(referenciaTipo)
            .referenciaId(referenciaId)
            .active(true)
            .build();

        notificacaoRepository.save(notificacao);
        log.info("Notificacao criada: tipo={}, userId={}, titulo={}", tipo, userId, titulo);
    }

    @Transactional
    public void criarNotificacaoParaTodosComRole(String role, TipoNotificacao tipo, String titulo,
                                                   String mensagem, String referenciaTipo, UUID referenciaId) {
        List<User> users = userRepository.findByRoleAndActiveTrue(
            com.condocompare.users.entity.Role.valueOf(role)
        );

        for (User user : users) {
            criarNotificacao(user.getId(), tipo, titulo, mensagem, referenciaTipo, referenciaId);
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificacaoResponse> getNotificacoes(Pageable pageable) {
        User currentUser = getCurrentUser();
        return notificacaoRepository.findByUserIdAndActiveTrueOrderByCreatedAtDesc(currentUser.getId(), pageable)
            .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<NotificacaoResponse> getNaoLidas() {
        User currentUser = getCurrentUser();
        return notificacaoRepository.findByUserIdAndLidaFalseAndActiveTrueOrderByCreatedAtDesc(currentUser.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public long countNaoLidas() {
        User currentUser = getCurrentUser();
        return notificacaoRepository.countByUserIdAndLidaFalseAndActiveTrue(currentUser.getId());
    }

    @Transactional
    public NotificacaoResponse marcarComoLida(UUID id) {
        User currentUser = getCurrentUser();

        Notificacao notificacao = notificacaoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada"));

        if (!notificacao.getUserId().equals(currentUser.getId())) {
            throw new BusinessException("Notificação não pertence ao usuário");
        }

        notificacao.setLida(true);
        notificacao.setDataLeitura(LocalDateTime.now());
        notificacaoRepository.save(notificacao);

        return toResponse(notificacao);
    }

    @Transactional
    public void marcarTodasComoLidas() {
        User currentUser = getCurrentUser();
        notificacaoRepository.markAllAsReadByUserId(currentUser.getId());
        log.info("Todas notificacoes marcadas como lidas: userId={}", currentUser.getId());
    }

    @Transactional
    public void delete(UUID id) {
        User currentUser = getCurrentUser();

        Notificacao notificacao = notificacaoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada"));

        if (!notificacao.getUserId().equals(currentUser.getId())) {
            throw new BusinessException("Notificação não pertence ao usuário");
        }

        notificacao.setActive(false);
        notificacaoRepository.save(notificacao);
    }

    public boolean notificacaoJaEnviada(TipoNotificacao tipo, UUID referenciaId) {
        return notificacaoRepository.existsByTipoAndReferenciaIdAndActiveTrue(tipo, referenciaId);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
    }

    private NotificacaoResponse toResponse(Notificacao n) {
        return new NotificacaoResponse(
            n.getId(),
            n.getTipo(),
            n.getTitulo(),
            n.getMensagem(),
            n.getLida(),
            n.getDataLeitura(),
            n.getReferenciaTipo(),
            n.getReferenciaId(),
            n.getCreatedAt()
        );
    }
}
