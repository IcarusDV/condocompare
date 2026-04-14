package com.condocompare.condominios.entity;

import com.condocompare.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "condominios", schema = "condocompare")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Condominio extends BaseEntity {

    @Column(nullable = false)
    private String nome;

    @Column(unique = true)
    private String cnpj;

    @Column(nullable = false)
    private String endereco;

    private String numero;

    private String complemento;

    private String bairro;

    private String cidade;

    private String estado;

    private String cep;

    @Column(name = "area_construida")
    private BigDecimal areaConstruida;

    @Column(name = "area_total")
    private BigDecimal areaTotal;

    @Column(name = "numero_unidades")
    private Integer numeroUnidades;

    @Column(name = "numero_blocos")
    private Integer numeroBlocos;

    @Column(name = "numero_elevadores")
    private Integer numeroElevadores;

    @Column(name = "numero_andares")
    private Integer numeroAndares;

    @Column(name = "numero_funcionarios")
    private Integer numeroFuncionarios;

    @Column(name = "ano_construcao")
    private Integer anoConstrucao;

    @Column(name = "tem_placas_solares")
    private Boolean temPlacasSolares;

    @Column(name = "tem_piscina")
    private Boolean temPiscina;

    @Column(name = "tem_academia")
    private Boolean temAcademia;

    @Column(name = "tem_salao_festas")
    private Boolean temSalaoFestas;

    @Column(name = "tem_playground")
    private Boolean temPlayground;

    @Column(name = "tem_churrasqueira")
    private Boolean temChurrasqueira;

    @Column(name = "tem_quadra")
    private Boolean temQuadra;

    @Column(name = "tem_portaria_24h")
    private Boolean temPortaria24h;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_construcao")
    private TipoConstrucao tipoConstrucao;

    @Column(name = "administradora_id")
    private UUID administradoraId;

    @Column(name = "administradora_nome")
    private String administradoraNome;

    @Column(name = "sindico_id")
    private UUID sindicoId;

    @Column(name = "sindico_nome")
    private String sindicoNome;

    @Column(name = "sindico_email")
    private String sindicoEmail;

    @Column(name = "sindico_telefone")
    private String sindicoTelefone;

    @Column(name = "vencimento_apolice")
    private LocalDate vencimentoApolice;

    @Column(name = "seguradora_atual")
    private String seguradoraAtual;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // ============================================================
    // ESTRUTURA ESTENDIDA (V3 migration)
    // ============================================================

    @Column(name = "possui_area_comercial")
    private Boolean possuiAreaComercial;

    @Column(name = "tamanho_area_comercial")
    private BigDecimal tamanhoAreaComercial;

    @Column(name = "num_funcionarios_registrados")
    private Integer numFuncionariosRegistrados;

    @Column(name = "idade_funcionarios_registrados")
    private String idadeFuncionariosRegistrados;

    @Column(name = "num_pavimentos")
    private Integer numPavimentos;

    @Column(name = "possui_garagem")
    private Boolean possuiGaragem;

    @Column(name = "vagas_garagem")
    private Integer vagasGaragem;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "espacos_conveniencia", columnDefinition = "text[]")
    private List<String> espacosConveniencia;

    @Column(name = "espacos_conveniencia_outros")
    private String espacosConvenienciaOutros;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "sistema_protecao_incendio", columnDefinition = "text[]")
    private List<String> sistemaProtecaoIncendio;

    @Column(name = "sistema_protecao_incendio_outros")
    private String sistemaProtecaoIncendioOutros;

    @Column(name = "possui_recarga_eletricos")
    private Boolean possuiRecargaEletricos;

    @Column(name = "possui_bicicletario")
    private Boolean possuiBicicletario;

    // ============================================================
    // SEGURO ESTENDIDO
    // ============================================================

    @Column(name = "bonus_anos_sem_sinistro")
    private String bonusAnosSemSinistro;

    @Column(name = "quantidade_sinistros")
    private String quantidadeSinistros;

    // ============================================================
    // CAMPOS CONDICIONAIS (Tipos Horizontais)
    // ============================================================

    @Column(name = "numero_casas")
    private Integer numeroCasas;

    @Column(name = "numero_salas")
    private Integer numeroSalas;
}
