package com.condocompare.billing.dto;

import com.condocompare.billing.entity.Plano;

import java.math.BigDecimal;
import java.util.UUID;

public record PlanoResponse(
    UUID id,
    String nome,
    String codigo,
    String descricao,
    BigDecimal precoMensal,
    BigDecimal precoAnual,
    Integer maxCondominios,
    Integer maxDocumentosMes,
    Integer maxUsuarios,
    Boolean temDiagnostico,
    Boolean temAssistenteIa,
    Boolean temRag,
    Boolean temVistoriaCompleta,
    Boolean temLaudoTecnico,
    Boolean temParceiros,
    Boolean temRelatoriosAvancados,
    Boolean temApiAcesso,
    Boolean destaque
) {
    public static PlanoResponse from(Plano p) {
        return new PlanoResponse(
            p.getId(), p.getNome(), p.getCodigo(), p.getDescricao(),
            p.getPrecoMensal(), p.getPrecoAnual(),
            p.getMaxCondominios(), p.getMaxDocumentosMes(), p.getMaxUsuarios(),
            p.getTemDiagnostico(), p.getTemAssistenteIa(), p.getTemRag(),
            p.getTemVistoriaCompleta(), p.getTemLaudoTecnico(), p.getTemParceiros(),
            p.getTemRelatoriosAvancados(), p.getTemApiAcesso(), p.getDestaque()
        );
    }
}
