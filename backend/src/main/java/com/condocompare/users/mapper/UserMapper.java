package com.condocompare.users.mapper;

import com.condocompare.users.dto.CreateUserRequest;
import com.condocompare.users.dto.UserListResponse;
import com.condocompare.users.dto.UserResponse;
import com.condocompare.users.entity.User;
import org.springframework.stereotype.Component;

import java.util.HashSet;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getPhone(),
            user.getRole(),
            user.getOrganizationId(),
            user.getOrganizationName(),
            user.isEmailVerified(),
            user.getPermissions(),
            user.isActive(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }

    public UserListResponse toListResponse(User user) {
        return new UserListResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getPhone(),
            user.getRole(),
            user.getOrganizationName(),
            user.isEmailVerified(),
            user.isActive()
        );
    }

    public User toEntity(CreateUserRequest request, String encodedPassword) {
        return User.builder()
            .email(request.email())
            .password(encodedPassword)
            .name(request.name())
            .phone(request.phone())
            .role(request.role())
            .organizationId(request.organizationId())
            .organizationName(request.organizationName())
            .permissions(request.permissions() != null ? request.permissions() : new HashSet<>())
            .emailVerified(false)
            .build();
    }
}
