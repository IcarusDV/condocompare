package com.condocompare.documentos.dto;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;

public record DadosOrcamentoDTO(
    @Valid
    List<CoberturaDTO> coberturas,
    List<String> condicoesEspeciais,
    BigDecimal descontos,
    String formaPagamento,
    String observacoesInternas
) {}
