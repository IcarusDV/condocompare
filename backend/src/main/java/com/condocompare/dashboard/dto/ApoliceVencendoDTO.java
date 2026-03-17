package com.condocompare.dashboard.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ApoliceVencendoDTO(
    UUID id,
    String nome,
    String condominioNome,
    String seguradoraNome,
    LocalDate dataVencimento,
    long diasParaVencer
) {}
