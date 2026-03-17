package com.condocompare.users.dto;

import com.condocompare.users.entity.Role;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String name,
    String phone,
    Role role,
    UUID organizationId,
    String organizationName,
    boolean emailVerified,
    Set<String> permissions,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
