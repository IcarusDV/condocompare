package com.condocompare.sinistros.entity;

import com.condocompare.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "sinistros", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sinistro extends BaseEntity {

    @Column(name = "condominio_id", nullable = false)
    private UUID condominioId;

    @Column(name = "apolice_id")
    private UUID apoliceId;

    @Column(name = "numero_sinistro", length = 100)
    private String numeroSinistro;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TipoSinistro tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private StatusSinistro status;

    @Column(name = "data_ocorrencia", nullable = false)
    private LocalDateTime dataOcorrencia;

    @Column(name = "data_comunicacao")
    private LocalDateTime dataComunicacao;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "local_ocorrencia")
    private String localOcorrencia;

    @Column(name = "valor_prejuizo", precision = 12, scale = 2)
    private BigDecimal valorPrejuizo;

    @Column(name = "valor_franquia", precision = 12, scale = 2)
    private BigDecimal valorFranquia;

    @Column(name = "valor_indenizado", precision = 12, scale = 2)
    private BigDecimal valorIndenizado;

    @Column(name = "cobertura_acionada")
    private String coberturaAcionada;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "documentos_ids", columnDefinition = "uuid[]")
    private UUID[] documentosIds;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "fotos_urls", columnDefinition = "text[]")
    private String[] fotosUrls;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> historico;

    @Column(name = "seguradora_protocolo", length = 100)
    private String seguradoraProtocolo;

    @Column(name = "seguradora_contato")
    private String seguradoraContato;

    @Column(columnDefinition = "TEXT")
    private String observacoes;
}
