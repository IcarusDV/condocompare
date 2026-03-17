package com.condocompare.vistorias.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vistoria_fotos", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VistoriaFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "vistoria_id", nullable = false)
    private UUID vistoriaId;

    @Column(name = "vistoria_item_id")
    private UUID vistoriaItemId;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 255)
    private String descricao;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
