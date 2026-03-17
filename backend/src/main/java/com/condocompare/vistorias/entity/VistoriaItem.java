package com.condocompare.vistorias.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vistoria_itens", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VistoriaItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "vistoria_id", nullable = false)
    private UUID vistoriaId;

    @Column(nullable = false, length = 100)
    private String categoria;

    @Column(nullable = false, length = 500)
    private String descricao;

    @Column(nullable = false, length = 50)
    private String status; // PENDENTE, CONFORME, NAO_CONFORME, NA

    @Column(length = 20)
    private String severidade; // BAIXA, MEDIA, ALTA, CRITICA

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @Column
    private Integer ordem;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
