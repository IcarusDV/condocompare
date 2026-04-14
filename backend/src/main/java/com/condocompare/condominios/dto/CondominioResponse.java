package com.condocompare.condominios.dto;

import com.condocompare.condominios.entity.TipoConstrucao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
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
        TipoConstrucao tipoConstrucao,
        Integer numeroCasas,
        Integer numeroSalas
    ) {}

    public record AmenidadesResponse(
        Boolean temPlacasSolares,
        Boolean temPiscina,
        Boolean temAcademia,
        Boolean temSalaoFestas,
        Boolean temPlayground,
        Boolean temChurrasqueira,
        Boolean temQuadra,
        Boolean temPortaria24h,
        // Estrutura estendida
        Boolean possuiAreaComercial,
        BigDecimal tamanhoAreaComercial,
        Integer numFuncionariosRegistrados,
        String idadeFuncionariosRegistrados,
        Integer numPavimentos,
        Boolean possuiGaragem,
        Integer vagasGaragem,
        List<String> espacosConveniencia,
        String espacosConvenienciaOutros,
        List<String> sistemaProtecaoIncendio,
        String sistemaProtecaoIncendioOutros,
        Boolean possuiRecargaEletricos,
        Boolean possuiBicicletario
    ) {}

    public record SindicoResponse(
        UUID sindicoId,
        String sindicoNome,
        String sindicoEmail,
        String sindicoTelefone
    ) {}

    public record SeguroResponse(
        LocalDate vencimentoApolice,
        String seguradoraAtual,
        Integer diasParaVencimento,
        String bonusAnosSemSinistro,
        String quantidadeSinistros
    ) {}
}
