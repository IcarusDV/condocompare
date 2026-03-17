package com.condocompare.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "assinaturas", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assinatura {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "plano_id", nullable = false)
    private UUID planoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plano_id", insertable = false, updatable = false)
    private Plano plano;

    @Column(nullable = false, length = 50)
    private String status; // ATIVA, CANCELADA, EXPIRADA, SUSPENSA

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim")
    private LocalDate dataFim;

    @Column(name = "data_cancelamento")
    private LocalDate dataCancelamento;

    @Column(name = "tipo_pagamento", length = 50)
    private String tipoPagamento; // MENSAL, ANUAL

    @Column(nullable = false)
    private BigDecimal valor;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
