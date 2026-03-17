package com.condocompare.users.dto;

import com.condocompare.users.entity.Role;

import java.util.UUID;

public record UserListResponse(
    UUID id,
    String email,
    String name,
    String phone,
    Role role,
    String organizationName,
    boolean emailVerified,
    boolean active
) {}
