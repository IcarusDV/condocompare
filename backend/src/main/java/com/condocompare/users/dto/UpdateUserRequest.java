package com.condocompare.users.dto;

import com.condocompare.users.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.Set;
import java.util.UUID;

public record UpdateUserRequest(
    @Email(message = "Email inválido")
    String email,

    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    String password,

    String name,
    String phone,
    Role role,
    UUID organizationId,
    String organizationName,
    Set<String> permissions,
    Boolean emailVerified
) {}
