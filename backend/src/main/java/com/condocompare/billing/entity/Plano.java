package com.condocompare.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "planos", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plano {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "preco_mensal", nullable = false)
    private BigDecimal precoMensal;

    @Column(name = "preco_anual")
    private BigDecimal precoAnual;

    @Column(name = "max_condominios")
    private Integer maxCondominios;

    @Column(name = "max_documentos_mes")
    private Integer maxDocumentosMes;

    @Column(name = "max_usuarios")
    private Integer maxUsuarios;

    @Column(name = "tem_diagnostico")
    private Boolean temDiagnostico;

    @Column(name = "tem_assistente_ia")
    private Boolean temAssistenteIa;

    @Column(name = "tem_rag")
    private Boolean temRag;

    @Column(name = "tem_vistoria_completa")
    private Boolean temVistoriaCompleta;

    @Column(name = "tem_laudo_tecnico")
    private Boolean temLaudoTecnico;

    @Column(name = "tem_parceiros")
    private Boolean temParceiros;

    @Column(name = "tem_relatorios_avancados")
    private Boolean temRelatoriosAvancados;

    @Column(name = "tem_api_acesso")
    private Boolean temApiAcesso;

    @Column
    private Boolean ativo;

    @Column
    private Integer ordem;

    @Column
    private Boolean destaque;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
