package com.condocompare.ia.dto;

import jakarta.validation.constraints.NotBlank;

public record AddMessageRequest(
    @NotBlank String role,
    @NotBlank String content,
    String sources
) {}
