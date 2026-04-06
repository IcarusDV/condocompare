package com.condocompare.condominios.service;

import com.condocompare.common.audit.AuditService;
import com.condocompare.common.exception.BusinessException;
import com.condocompare.condominios.dto.*;
import com.condocompare.condominios.entity.Condominio;
import com.condocompare.condominios.mapper.CondominioMapper;
import com.condocompare.condominios.repository.CondominioRepository;
import com.condocompare.condominios.repository.CondominioSpecification;
import com.condocompare.users.entity.Role;
import com.condocompare.users.entity.User;
import com.condocompare.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CondominioService {

    private final CondominioRepository condominioRepository;
    private final CondominioMapper condominioMapper;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public CondominioResponse create(CreateCondominioRequest request) {
        User currentUser = getCurrentUser();

        // Valida CNPJ único
        if (request.cnpj() != null && condominioRepository.existsByCnpjAndActiveTrue(request.cnpj())) {
            throw new BusinessException("CNPJ já cadastrado");
        }

        Condominio condominio = condominioMapper.toEntity(request);

        // Define administradora baseado no usuário
        if (currentUser.getRole() == Role.ADMINISTRADORA) {
            condominio.setAdministradoraId(currentUser.getOrganizationId());
            condominio.setAdministradoraNome(currentUser.getOrganizationName());
        } else if (currentUser.getRole() == Role.CORRETORA || currentUser.getRole() == Role.ADMIN) {
            // Corretora/Admin pode criar sem vincular administradora
        }

        Condominio saved = condominioRepository.save(condominio);
        log.info("Condomínio criado: {} por usuário: {}", saved.getId(), currentUser.getEmail());
        auditService.log("CREATE", "CONDOMINIO", saved.getId(), "Nome: " + saved.getNome());

        return condominioMapper.toResponse(saved);
    }

    @Transactional
    public CondominioResponse update(UUID id, UpdateCondominioRequest request) {
        User currentUser = getCurrentUser();
        Condominio condominio = findByIdWithAccessCheck(id, currentUser);

        // Valida CNPJ único (exceto o próprio)
        if (request.cnpj() != null &&
            condominioRepository.existsByCnpjAndIdNotAndActiveTrue(request.cnpj(), id)) {
            throw new BusinessException("CNPJ já cadastrado em outro condomínio");
        }

        condominioMapper.updateEntity(request, condominio);
        Condominio saved = condominioRepository.save(condominio);

        log.info("Condomínio atualizado: {} por usuário: {}", id, currentUser.getEmail());
        auditService.log("UPDATE", "CONDOMINIO", id);
        return condominioMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CondominioResponse findById(UUID id) {
        User currentUser = getCurrentUser();
        Condominio condominio = findByIdWithAccessCheck(id, currentUser);
        return condominioMapper.toResponse(condominio);
    }

    @Transactional(readOnly = true)
    public Page<CondominioListResponse> findAll(CondominioFilter filter, Pageable pageable) {
        User currentUser = getCurrentUser();

        UUID administradoraId = null;
        UUID sindicoId = null;

        // Aplica filtro de acesso por perfil
        switch (currentUser.getRole()) {
            case ADMINISTRADORA:
                administradoraId = currentUser.getOrganizationId();
                break;
            case SINDICO:
                sindicoId = currentUser.getId();
                break;
            case CORRETORA:
            case ADMIN:
                // Acesso total
                break;
        }

        Page<Condominio> page = condominioRepository.findAll(
            CondominioSpecification.withFilter(filter, administradoraId, sindicoId),
            pageable
        );

        return page.map(condominioMapper::toListResponse);
    }

    @Transactional
    public void delete(UUID id) {
        User currentUser = getCurrentUser();

        // Apenas ADMIN e CORRETORA podem deletar
        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.CORRETORA) {
            throw new BusinessException("Sem permissão para deletar condomínio");
        }

        Condominio condominio = findByIdWithAccessCheck(id, currentUser);

        // Soft delete
        condominio.setActive(false);
        condominioRepository.save(condominio);

        log.info("Condomínio deletado (soft): {} por usuário: {}", id, currentUser.getEmail());
        auditService.log("DELETE", "CONDOMINIO", id);
    }

    @Transactional(readOnly = true)
    public List<CondominioListResponse> findCondominiosVencendo(int dias) {
        LocalDate limite = LocalDate.now().plusDays(dias);
        return condominioRepository.findCondominiosComApoliceVencendo(LocalDate.now(), limite)
            .stream()
            .map(condominioMapper::toListResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<CondominioListResponse> findCondominiosVencidos() {
        return condominioRepository.findCondominiosComApoliceVencida(LocalDate.now())
            .stream()
            .map(condominioMapper::toListResponse)
            .toList();
    }

    @Transactional
    public CondominioResponse vincularSindico(UUID condominioId, UUID sindicoId) {
        User currentUser = getCurrentUser();

        // Apenas ADMIN, CORRETORA e ADMINISTRADORA podem vincular síndico
        if (currentUser.getRole() == Role.SINDICO) {
            throw new BusinessException("Síndico não pode vincular outros síndicos");
        }

        Condominio condominio = findByIdWithAccessCheck(condominioId, currentUser);

        User sindico = userRepository.findById(sindicoId)
            .orElseThrow(() -> new BusinessException("Síndico não encontrado"));

        if (sindico.getRole() != Role.SINDICO) {
            throw new BusinessException("Usuário informado não é um síndico");
        }

        condominio.setSindicoId(sindico.getId());
        condominio.setSindicoNome(sindico.getName());
        condominio.setSindicoEmail(sindico.getEmail());
        condominio.setSindicoTelefone(sindico.getPhone());

        Condominio saved = condominioRepository.save(condominio);
        log.info("Síndico {} vinculado ao condomínio {} por {}", sindicoId, condominioId, currentUser.getEmail());

        return condominioMapper.toResponse(saved);
    }

    @Transactional
    public CondominioResponse vincularAdministradora(UUID condominioId, UUID administradoraId, String administradoraNome) {
        User currentUser = getCurrentUser();

        // Apenas ADMIN e CORRETORA podem vincular administradora
        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.CORRETORA) {
            throw new BusinessException("Sem permissão para vincular administradora");
        }

        Condominio condominio = findByIdWithAccessCheck(condominioId, currentUser);

        condominio.setAdministradoraId(administradoraId);
        condominio.setAdministradoraNome(administradoraNome);

        Condominio saved = condominioRepository.save(condominio);
        log.info("Administradora vinculada ao condomínio {} por {}", condominioId, currentUser.getEmail());

        return condominioMapper.toResponse(saved);
    }

    // === Métodos auxiliares ===

    /**
     * Valida se o usuário atual tem acesso ao condomínio informado.
     * Lança BusinessException se não tiver. Usado por outros services para
     * garantir que dados vinculados a um condomínio respeitem o RBAC.
     */
    public void validateCondominioAccess(UUID condominioId) {
        User currentUser = getCurrentUser();
        findByIdWithAccessCheck(condominioId, currentUser);
    }

    private Condominio findByIdWithAccessCheck(UUID id, User user) {
        Condominio condominio = condominioRepository.findById(id)
            .filter(Condominio::isActive)
            .orElseThrow(() -> new BusinessException("Condomínio não encontrado"));

        // Verifica acesso baseado no perfil
        switch (user.getRole()) {
            case ADMINISTRADORA:
                if (!condominio.getAdministradoraId().equals(user.getOrganizationId())) {
                    throw new BusinessException("Sem permissão para acessar este condomínio");
                }
                break;
            case SINDICO:
                if (!user.getId().equals(condominio.getSindicoId())) {
                    throw new BusinessException("Sem permissão para acessar este condomínio");
                }
                break;
            case CORRETORA:
            case ADMIN:
                // Acesso total
                break;
        }

        return condominio;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
    }
}
