package com.condocompare.auth.dto;

import com.condocompare.users.entity.Role;
import java.util.UUID;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    Long expiresIn,
    UserInfo user
) {
    public record UserInfo(
        UUID id,
        String name,
        String email,
        Role role,
        String organizationName
    ) {}
}
