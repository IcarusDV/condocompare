package com.condocompare.parceiros.dto;

import com.condocompare.parceiros.entity.CategoriaParceiro;
import jakarta.validation.constraints.*;

import java.util.Set;

public record CreateParceiroRequest(
    @NotBlank(message = "Nome e obrigatorio")
    @Size(max = 255, message = "Nome deve ter no maximo 255 caracteres")
    String nome,

    @Size(max = 255, message = "Nome fantasia deve ter no maximo 255 caracteres")
    String nomeFantasia,

    @Size(max = 20, message = "CNPJ deve ter no maximo 20 caracteres")
    String cnpj,

    @Size(max = 20, message = "CPF deve ter no maximo 20 caracteres")
    String cpf,

    @Email(message = "Email invalido")
    @Size(max = 255, message = "Email deve ter no maximo 255 caracteres")
    String email,

    @Size(max = 20, message = "Telefone deve ter no maximo 20 caracteres")
    String telefone,

    @Size(max = 20, message = "Celular deve ter no maximo 20 caracteres")
    String celular,

    @Size(max = 255, message = "Website deve ter no maximo 255 caracteres")
    String website,

    @Size(max = 500, message = "Endereco deve ter no maximo 500 caracteres")
    String endereco,

    @Size(max = 20, message = "Numero deve ter no maximo 20 caracteres")
    String numero,

    @Size(max = 100, message = "Complemento deve ter no maximo 100 caracteres")
    String complemento,

    @Size(max = 100, message = "Bairro deve ter no maximo 100 caracteres")
    String bairro,

    @Size(max = 100, message = "Cidade deve ter no maximo 100 caracteres")
    String cidade,

    @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres")
    String estado,

    @Size(max = 10, message = "CEP deve ter no maximo 10 caracteres")
    String cep,

    @NotEmpty(message = "Pelo menos uma categoria e obrigatoria")
    Set<CategoriaParceiro> categorias,

    @Size(max = 2000, message = "Descricao de servicos deve ter no maximo 2000 caracteres")
    String descricaoServicos,

    @Size(max = 500, message = "Area de atuacao deve ter no maximo 500 caracteres")
    String areaAtuacao,

    @Size(max = 255, message = "Nome do contato deve ter no maximo 255 caracteres")
    String contatoNome,

    @Size(max = 100, message = "Cargo do contato deve ter no maximo 100 caracteres")
    String contatoCargo,

    @Size(max = 2000, message = "Observacoes deve ter no maximo 2000 caracteres")
    String observacoes,

    @Size(max = 500, message = "URL do logo deve ter no maximo 500 caracteres")
    String logoUrl
) {}
