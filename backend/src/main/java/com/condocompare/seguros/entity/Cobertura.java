package com.condocompare.seguros.entity;

import com.condocompare.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "coberturas", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cobertura extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apolice_id", nullable = false)
    private Apolice apolice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoCobertura tipo;

    @Column(nullable = false, length = 500)
    private String descricao;

    @Column(name = "limite_maximo", precision = 15, scale = 2)
    private BigDecimal limiteMaximo;

    @Column(precision = 15, scale = 2)
    private BigDecimal franquia;

    @Column(name = "franquia_percentual", precision = 5, scale = 2)
    private BigDecimal franquiaPercentual;

    @Column(name = "carencia_dias")
    private Integer carenciaDias;

    @Column(columnDefinition = "TEXT")
    private String condicoesEspeciais;

    @Column(columnDefinition = "TEXT")
    private String exclusoes;

    @Column(name = "contratada")
    private boolean contratada = true;

    @Column(name = "obrigatoria")
    private boolean obrigatoria = false;

    @Column(name = "recomendada")
    private boolean recomendada = false;
}
