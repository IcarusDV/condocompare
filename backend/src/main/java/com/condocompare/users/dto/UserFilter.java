package com.condocompare.users.dto;

import com.condocompare.users.entity.Role;

public record UserFilter(
    String search,
    Role role,
    Boolean emailVerified,
    Boolean active
) {}
