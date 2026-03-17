package com.condocompare.condominios.dto;

import com.condocompare.condominios.entity.TipoConstrucao;

import java.time.LocalDate;
import java.util.UUID;

public record CondominioListResponse(
    UUID id,
    String nome,
    String cnpj,
    String cidade,
    String estado,
    Integer numeroUnidades,
    TipoConstrucao tipoConstrucao,
    String seguradoraAtual,
    LocalDate vencimentoApolice,
    Integer diasParaVencimento,
    StatusApolice statusApolice
) {
    public enum StatusApolice {
        VENCIDA,
        VENCENDO,  // Próximos 30 dias
        VIGENTE,
        SEM_APOLICE
    }
}
