package com.condocompare.users.entity;

import com.condocompare.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(name = "phone")
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "organization_name")
    private String organizationName;

    @Column(name = "email_verified")
    private boolean emailVerified = false;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
        name = "user_permissions",
        schema = "condocompare",
        joinColumns = @JoinColumn(name = "user_id")
    )
    @Column(name = "permission")
    @Builder.Default
    private Set<String> permissions = new HashSet<>();
}
