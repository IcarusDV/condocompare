package com.condocompare.parceiros.dto;

import com.condocompare.parceiros.entity.CategoriaParceiro;
import com.condocompare.parceiros.entity.Parceiro;

import java.util.Set;
import java.util.UUID;

public record ParceiroListResponse(
    UUID id,
    String nome,
    String nomeFantasia,
    String email,
    String telefone,
    String cidade,
    String estado,
    Set<CategoriaParceiro> categorias,
    Double avaliacao,
    Integer totalAvaliacoes,
    Boolean ativo,
    Boolean verificado,
    String logoUrl
) {
    public static ParceiroListResponse from(Parceiro parceiro) {
        return new ParceiroListResponse(
            parceiro.getId(),
            parceiro.getNome(),
            parceiro.getNomeFantasia(),
            parceiro.getEmail(),
            parceiro.getTelefone(),
            parceiro.getCidade(),
            parceiro.getEstado(),
            parceiro.getCategorias(),
            parceiro.getAvaliacao(),
            parceiro.getTotalAvaliacoes(),
            parceiro.getAtivo(),
            parceiro.getVerificado(),
            parceiro.getLogoUrl()
        );
    }
}
