package com.condocompare.common.security;

import com.condocompare.common.exception.BusinessException;
import com.condocompare.users.entity.User;
import com.condocompare.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Helper para extrair dados do usuário autenticado a partir do SecurityContext.
 * NUNCA confiar em headers como X-User-Id - sempre extrair do JWT via este utilitário.
 */
@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    /**
     * Retorna o email (username) do usuário atualmente autenticado.
     * @throws BusinessException se não houver usuário autenticado
     */
    public String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new BusinessException("Usuário não autenticado");
        }
        return auth.getName();
    }

    /**
     * Retorna o User autenticado (entidade completa).
     * @throws BusinessException se não houver usuário autenticado ou não for encontrado no banco
     */
    public User getCurrentUser() {
        String email = getCurrentUserEmail();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
    }

    /**
     * Retorna o UUID do usuário autenticado.
     * @throws BusinessException se não houver usuário autenticado
     */
    public UUID getCurrentUserId() {
        return getCurrentUser().getId();
    }
}
