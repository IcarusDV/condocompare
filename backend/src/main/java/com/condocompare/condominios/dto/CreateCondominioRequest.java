package com.condocompare.condominios.dto;

import com.condocompare.condominios.entity.TipoConstrucao;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateCondominioRequest(
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
    String nome,

    @Size(max = 20, message = "CNPJ deve ter no máximo 20 caracteres")
    String cnpj,

    @NotBlank(message = "Endereço é obrigatório")
    @Size(max = 500, message = "Endereço deve ter no máximo 500 caracteres")
    String endereco,

    @Size(max = 20, message = "Número deve ter no máximo 20 caracteres")
    String numero,

    @Size(max = 100, message = "Complemento deve ter no máximo 100 caracteres")
    String complemento,

    @Size(max = 100, message = "Bairro deve ter no máximo 100 caracteres")
    String bairro,

    @Size(max = 100, message = "Cidade deve ter no máximo 100 caracteres")
    String cidade,

    @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres")
    String estado,

    @Size(max = 10, message = "CEP deve ter no máximo 10 caracteres")
    String cep,

    @DecimalMin(value = "0.0", message = "Área construída deve ser positiva")
    BigDecimal areaConstruida,

    @DecimalMin(value = "0.0", message = "Área total deve ser positiva")
    BigDecimal areaTotal,

    @Min(value = 1, message = "Número de unidades deve ser pelo menos 1")
    Integer numeroUnidades,

    @Min(value = 0, message = "Número de blocos não pode ser negativo")
    Integer numeroBlocos,

    @Min(value = 0, message = "Número de elevadores não pode ser negativo")
    Integer numeroElevadores,

    @Min(value = 0, message = "Número de andares não pode ser negativo")
    Integer numeroAndares,

    @Min(value = 0, message = "Número de funcionários não pode ser negativo")
    Integer numeroFuncionarios,

    @Min(value = 1900, message = "Ano de construção inválido")
    @Max(value = 2100, message = "Ano de construção inválido")
    Integer anoConstrucao,

    Boolean temPlacasSolares,
    Boolean temPiscina,
    Boolean temAcademia,
    Boolean temSalaoFestas,
    Boolean temPlayground,
    Boolean temChurrasqueira,
    Boolean temQuadra,
    Boolean temPortaria24h,

    TipoConstrucao tipoConstrucao,

    String sindicoNome,

    @Email(message = "Email do síndico inválido")
    String sindicoEmail,

    @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres")
    String sindicoTelefone,

    LocalDate vencimentoApolice,

    @Size(max = 255, message = "Seguradora deve ter no máximo 255 caracteres")
    String seguradoraAtual,

    String observacoes
) {}
