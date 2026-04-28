package com.condocompare.external.service;

import com.condocompare.common.exception.BusinessException;
import com.condocompare.common.exception.ResourceNotFoundException;
import com.condocompare.external.dto.CnpjResponse;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

/**
 * Consulta de CNPJ via BrasilAPI publica (https://brasilapi.com.br/docs#tag/CNPJ).
 * A BrasilAPI consulta diretamente os dados publicos da Receita Federal e nao exige API key.
 */
@Service
@Slf4j
public class CnpjService {

    private static final String BRASIL_API_BASE = "https://brasilapi.com.br/api/cnpj/v1";

    private final WebClient client = WebClient.builder()
        .baseUrl(BRASIL_API_BASE)
        .build();

    @Cacheable(value = "cnpj", key = "#cnpj")
    public CnpjResponse buscar(String cnpj) {
        String clean = cnpj == null ? "" : cnpj.replaceAll("\\D", "");
        if (clean.length() != 14) {
            throw new BusinessException("CNPJ invalido: deve conter 14 digitos");
        }

        try {
            BrasilApiCnpj raw = client.get()
                .uri("/{cnpj}", clean)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, resp ->
                    Mono.error(new ResourceNotFoundException("CNPJ nao encontrado na Receita Federal")))
                .bodyToMono(BrasilApiCnpj.class)
                .timeout(Duration.ofSeconds(10))
                .block();

            if (raw == null) {
                throw new ResourceNotFoundException("CNPJ nao encontrado");
            }

            LocalDate dataAbertura = parseDate(raw.dataInicioAtividade);
            Integer idade = dataAbertura != null
                ? LocalDate.now().getYear() - dataAbertura.getYear()
                : null;

            return new CnpjResponse(
                raw.cnpj,
                raw.razaoSocial,
                raw.nomeFantasia,
                dataAbertura,
                idade,
                raw.descricaoSituacaoCadastral,
                raw.logradouro,
                raw.numero,
                raw.complemento,
                raw.bairro,
                raw.municipio,
                raw.uf,
                raw.cep,
                raw.email,
                raw.telefone,
                raw.cnaeFiscalDescricao
            );
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (WebClientResponseException e) {
            log.warn("Erro consultando CNPJ {}: {}", clean, e.getStatusCode());
            throw new BusinessException("Erro ao consultar CNPJ: " + e.getStatusCode());
        } catch (Exception e) {
            log.warn("Erro inesperado consultando CNPJ {}: {}", clean, e.getMessage());
            throw new BusinessException("Servico de consulta de CNPJ indisponivel no momento");
        }
    }

    private LocalDate parseDate(String iso) {
        if (iso == null || iso.isBlank()) return null;
        try {
            return LocalDate.parse(iso);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record BrasilApiCnpj(
        String cnpj,
        @JsonProperty("razao_social") String razaoSocial,
        @JsonProperty("nome_fantasia") String nomeFantasia,
        @JsonProperty("data_inicio_atividade") String dataInicioAtividade,
        @JsonProperty("descricao_situacao_cadastral") String descricaoSituacaoCadastral,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String municipio,
        String uf,
        String cep,
        String email,
        @JsonProperty("ddd_telefone_1") String telefone,
        @JsonProperty("cnae_fiscal_descricao") String cnaeFiscalDescricao
    ) {}
}
