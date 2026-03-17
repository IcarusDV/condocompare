package com.condocompare.ia.dto;

import java.math.BigDecimal;
import java.util.List;

public record OrcamentoItemDTO(
    String seguradora,
    BigDecimal valorPremio,
    List<CoberturaItemDTO> coberturas,
    String formaPagamento,
    BigDecimal descontos
) {}
