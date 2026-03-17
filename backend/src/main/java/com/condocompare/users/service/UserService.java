package com.condocompare.users.service;

import com.condocompare.common.exception.BusinessException;
import com.condocompare.common.exception.ResourceNotFoundException;
import com.condocompare.users.dto.*;
import com.condocompare.users.entity.Role;
import com.condocompare.users.entity.User;
import com.condocompare.users.mapper.UserMapper;
import com.condocompare.users.repository.UserRepository;
import com.condocompare.users.repository.UserSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Email já cadastrado");
        }

        String encodedPassword = passwordEncoder.encode(request.password());
        User user = userMapper.toEntity(request, encodedPassword);
        user = userRepository.save(user);

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest request) {
        User user = findEntityById(id);

        if (StringUtils.hasText(request.email()) && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new BusinessException("Email já cadastrado");
            }
            user.setEmail(request.email());
        }

        if (StringUtils.hasText(request.password())) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        if (StringUtils.hasText(request.name())) {
            user.setName(request.name());
        }

        if (request.phone() != null) {
            user.setPhone(request.phone());
        }

        if (request.role() != null) {
            user.setRole(request.role());
        }

        if (request.organizationId() != null) {
            user.setOrganizationId(request.organizationId());
        }

        if (request.organizationName() != null) {
            user.setOrganizationName(request.organizationName());
        }

        if (request.permissions() != null) {
            user.setPermissions(request.permissions());
        }

        if (request.emailVerified() != null) {
            user.setEmailVerified(request.emailVerified());
        }

        user = userRepository.save(user);
        return userMapper.toResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse findById(UUID id) {
        return userMapper.toResponse(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public Page<UserListResponse> findAll(UserFilter filter, Pageable pageable) {
        return userRepository
            .findAll(UserSpecification.withFilter(filter), pageable)
            .map(userMapper::toListResponse);
    }

    @Transactional(readOnly = true)
    public List<UserListResponse> findByRole(Role role) {
        return userRepository.findByRoleAndActiveTrue(role)
            .stream()
            .map(userMapper::toListResponse)
            .toList();
    }

    @Transactional
    public void delete(UUID id) {
        User user = findEntityById(id);
        user.setActive(false);
        userRepository.save(user);
    }

    @Transactional
    public void activate(UUID id) {
        User user = findEntityById(id);
        user.setActive(true);
        userRepository.save(user);
    }

    @Transactional
    public UserResponse updateProfile(UpdateUserRequest request) {
        User currentUser = getCurrentUser();

        if (StringUtils.hasText(request.name())) {
            currentUser.setName(request.name());
        }
        if (request.phone() != null) {
            currentUser.setPhone(request.phone());
        }
        if (StringUtils.hasText(request.password())) {
            currentUser.setPassword(passwordEncoder.encode(request.password()));
        }

        currentUser = userRepository.save(currentUser);
        return userMapper.toResponse(currentUser);
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile() {
        return userMapper.toResponse(getCurrentUser());
    }

    @Transactional(readOnly = true)
    public long countUsers() {
        return userRepository.countByActiveTrue();
    }

    private User findEntityById(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }
}
