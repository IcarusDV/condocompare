package com.condocompare.billing.dto;

import com.condocompare.billing.entity.Assinatura;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AssinaturaResponse(
    UUID id,
    UUID userId,
    UUID planoId,
    String planoNome,
    String planoCodigo,
    String status,
    LocalDate dataInicio,
    LocalDate dataFim,
    String tipoPagamento,
    BigDecimal valor
) {
    public static AssinaturaResponse from(Assinatura a) {
        return new AssinaturaResponse(
            a.getId(), a.getUserId(), a.getPlanoId(),
            a.getPlano() != null ? a.getPlano().getNome() : null,
            a.getPlano() != null ? a.getPlano().getCodigo() : null,
            a.getStatus(), a.getDataInicio(), a.getDataFim(),
            a.getTipoPagamento(), a.getValor()
        );
    }
}
