package com.condocompare.seguros.entity;

import com.condocompare.common.entity.BaseEntity;
import com.condocompare.condominios.entity.Condominio;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "apolices", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Apolice extends BaseEntity {

    @Column(name = "numero_apolice", nullable = false)
    private String numeroApolice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "condominio_id", nullable = false)
    private Condominio condominio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seguradora_id", nullable = false)
    private Seguradora seguradora;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusApolice status;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim", nullable = false)
    private LocalDate dataFim;

    @Column(name = "premio_total", precision = 15, scale = 2)
    private BigDecimal premioTotal;

    @Column(name = "premio_liquido", precision = 15, scale = 2)
    private BigDecimal premioLiquido;

    @Column(precision = 15, scale = 2)
    private BigDecimal iof;

    @Column(name = "forma_pagamento")
    private String formaPagamento;

    @Column(name = "numero_parcelas")
    private Integer numeroParcelas;

    @Column(name = "valor_parcela", precision = 15, scale = 2)
    private BigDecimal valorParcela;

    @Column(name = "importancia_segurada_total", precision = 15, scale = 2)
    private BigDecimal importanciaSeguradaTotal;

    @Column(name = "documento_id")
    private UUID documentoId;

    @Column(name = "proposta_id")
    private UUID propostaId;

    @Column(name = "corretor_nome")
    private String corretorNome;

    @Column(name = "corretor_susep")
    private String corretorSusep;

    @Column(name = "corretor_telefone")
    private String corretorTelefone;

    @Column(name = "corretor_email")
    private String corretorEmail;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "clausulas_especiais", columnDefinition = "TEXT")
    private String clausulasEspeciais;

    @OneToMany(mappedBy = "apolice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Cobertura> coberturas = new ArrayList<>();

    public void addCobertura(Cobertura cobertura) {
        coberturas.add(cobertura);
        cobertura.setApolice(this);
    }

    public void removeCobertura(Cobertura cobertura) {
        coberturas.remove(cobertura);
        cobertura.setApolice(null);
    }

    public boolean isVigente() {
        LocalDate hoje = LocalDate.now();
        return status == StatusApolice.VIGENTE &&
               !hoje.isBefore(dataInicio) &&
               !hoje.isAfter(dataFim);
    }

    public boolean isVencendo(int dias) {
        LocalDate hoje = LocalDate.now();
        return isVigente() && dataFim.minusDays(dias).isBefore(hoje);
    }

    public long diasParaVencimento() {
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), dataFim);
    }
}
