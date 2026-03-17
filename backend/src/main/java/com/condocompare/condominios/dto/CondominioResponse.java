package com.condocompare.condominios.dto;

import com.condocompare.condominios.entity.TipoConstrucao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record CondominioResponse(
    UUID id,
    String nome,
    String cnpj,
    EnderecoResponse endereco,
    CaracteristicasResponse caracteristicas,
    AmenidadesResponse amenidades,
    SindicoResponse sindico,
    SeguroResponse seguro,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public record EnderecoResponse(
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String estado,
        String cep
    ) {}

    public record CaracteristicasResponse(
        BigDecimal areaConstruida,
        BigDecimal areaTotal,
        Integer numeroUnidades,
        Integer numeroBlocos,
        Integer numeroElevadores,
        Integer numeroAndares,
        Integer numeroFuncionarios,
        Integer anoConstrucao,
        TipoConstrucao tipoConstrucao
    ) {}

    public record AmenidadesResponse(
        Boolean temPlacasSolares,
        Boolean temPiscina,
        Boolean temAcademia,
        Boolean temSalaoFestas,
        Boolean temPlayground,
        Boolean temChurrasqueira,
        Boolean temQuadra,
        Boolean temPortaria24h
    ) {}

    public record SindicoResponse(
        UUID id,
        String nome,
        String email,
        String telefone
    ) {}

    public record SeguroResponse(
        LocalDate vencimentoApolice,
        String seguradoraAtual,
        Integer diasParaVencimento
    ) {}
}
