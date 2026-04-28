package com.condocompare.external.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;

/**
 * Resposta consolidada de consulta de CNPJ.
 * Os campos sao um subconjunto util do que a BrasilAPI retorna.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CnpjResponse(
    String cnpj,
    String razaoSocial,
    String nomeFantasia,
    LocalDate dataAbertura,
    Integer idadeAnos,
    String situacaoCadastral,
    String logradouro,
    String numero,
    String complemento,
    String bairro,
    String municipio,
    String uf,
    String cep,
    String email,
    String telefone,
    String cnaePrincipal
) {}
