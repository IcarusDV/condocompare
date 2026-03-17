package com.condocompare.parceiros.dto;

import com.condocompare.parceiros.entity.CategoriaParceiro;
import com.condocompare.parceiros.entity.Parceiro;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

public record ParceiroResponse(
    UUID id,
    String nome,
    String nomeFantasia,
    String cnpj,
    String cpf,
    String email,
    String telefone,
    String celular,
    String website,
    EnderecoResponse endereco,
    Set<CategoriaParceiro> categorias,
    String descricaoServicos,
    String areaAtuacao,
    Double avaliacao,
    Integer totalAvaliacoes,
    Boolean ativo,
    Boolean verificado,
    String contatoNome,
    String contatoCargo,
    String observacoes,
    String logoUrl,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public record EnderecoResponse(
        String endereco,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String estado,
        String cep
    ) {}

    public static ParceiroResponse from(Parceiro parceiro) {
        return new ParceiroResponse(
            parceiro.getId(),
            parceiro.getNome(),
            parceiro.getNomeFantasia(),
            parceiro.getCnpj(),
            parceiro.getCpf(),
            parceiro.getEmail(),
            parceiro.getTelefone(),
            parceiro.getCelular(),
            parceiro.getWebsite(),
            new EnderecoResponse(
                parceiro.getEndereco(),
                parceiro.getNumero(),
                parceiro.getComplemento(),
                parceiro.getBairro(),
                parceiro.getCidade(),
                parceiro.getEstado(),
                parceiro.getCep()
            ),
            parceiro.getCategorias(),
            parceiro.getDescricaoServicos(),
            parceiro.getAreaAtuacao(),
            parceiro.getAvaliacao(),
            parceiro.getTotalAvaliacoes(),
            parceiro.getAtivo(),
            parceiro.getVerificado(),
            parceiro.getContatoNome(),
            parceiro.getContatoCargo(),
            parceiro.getObservacoes(),
            parceiro.getLogoUrl(),
            parceiro.getCreatedAt(),
            parceiro.getUpdatedAt()
        );
    }
}
