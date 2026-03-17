package com.condocompare.vistorias.entity;

import com.condocompare.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "vistorias", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vistoria extends BaseEntity {

    @Column(name = "condominio_id", nullable = false)
    private UUID condominioId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TipoVistoria tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private StatusVistoria status;

    @Column(name = "data_agendada", nullable = false)
    private LocalDateTime dataAgendada;

    @Column(name = "data_realizada")
    private LocalDateTime dataRealizada;

    @Column(name = "responsavel_nome")
    private String responsavelNome;

    @Column(name = "responsavel_telefone", length = 20)
    private String responsavelTelefone;

    @Column(name = "responsavel_email")
    private String responsavelEmail;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "laudo_url", length = 500)
    private String laudoUrl;

    @Column(name = "documento_id")
    private UUID documentoId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "itens_vistoriados", columnDefinition = "jsonb")
    private List<Map<String, Object>> itensVistoriados;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> pendencias;

    @Column(name = "nota_geral")
    private Integer notaGeral;

    @Column(name = "laudo_texto", columnDefinition = "TEXT")
    private String laudoTexto;

    @Column(name = "laudo_gerado_em")
    private LocalDateTime laudoGeradoEm;

    @Column(name = "total_itens")
    private Integer totalItens;

    @Column(name = "itens_conformes")
    private Integer itensConformes;

    @Column(name = "itens_nao_conformes")
    private Integer itensNaoConformes;

    @Column(name = "shared_token", length = 36)
    private String sharedToken;
}
