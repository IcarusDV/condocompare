package com.condocompare.seguros.entity;

import com.condocompare.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;

@Entity
@Table(name = "seguradoras", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seguradora extends BaseEntity {

    @Column(nullable = false)
    private String nome;

    @Column(unique = true)
    private String cnpj;

    @Column(name = "codigo_susep")
    private String codigoSusep;

    private String telefone;

    private String email;

    private String website;

    @Column(name = "endereco_completo")
    private String enderecoCompleto;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "TEXT[]")
    private String[] especialidades;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "TEXT[]")
    private String[] regras;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "ia_conhecimento", columnDefinition = "TEXT[]")
    private String[] iaConhecimento;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "total_avaliacoes")
    private Integer totalAvaliacoes;
}
