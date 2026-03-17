package com.condocompare.documentos.entity;

import com.condocompare.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "documentos", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Documento extends BaseEntity {

    @Column(name = "condominio_id", nullable = false)
    private UUID condominioId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDocumento tipo;

    @Column(nullable = false)
    private String nome;

    @Column(name = "nome_arquivo", nullable = false)
    private String nomeArquivo;

    @Column(name = "nome_arquivo_storage")
    private String nomeArquivoStorage;

    @Column(name = "mime_type")
    private String mimeType;

    @Column(name = "tamanho_bytes")
    private Long tamanhoBytes;

    @Column(name = "bucket_name")
    private String bucketName;

    @Column(name = "object_key")
    private String objectKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusProcessamento status = StatusProcessamento.PENDENTE;

    @Column(name = "erro_processamento", columnDefinition = "TEXT")
    private String erroProcessamento;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dados_extraidos", columnDefinition = "jsonb")
    private Map<String, Object> dadosExtraidos;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // Campos para rastreamento de seguradora (quando tipo = ORCAMENTO)
    @Column(name = "seguradora_nome")
    private String seguradoraNome;

    @Column(name = "valor_premio")
    private java.math.BigDecimal valorPremio;

    @Column(name = "data_vigencia_inicio")
    private java.time.LocalDate dataVigenciaInicio;

    @Column(name = "data_vigencia_fim")
    private java.time.LocalDate dataVigenciaFim;

    @Column(name = "notificacao_vencimento_enviada")
    private Boolean notificacaoVencimentoEnviada = false;
}
