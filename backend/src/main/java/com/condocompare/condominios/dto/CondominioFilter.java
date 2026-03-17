package com.condocompare.condominios.dto;

import com.condocompare.condominios.entity.TipoConstrucao;

public record CondominioFilter(
    String search,           // Busca por nome, CNPJ ou cidade
    String cidade,
    String estado,
    TipoConstrucao tipoConstrucao,
    Boolean apoliceVencendo, // Próximos 30 dias
    Boolean apoliceVencida,
    String seguradora
) {}
