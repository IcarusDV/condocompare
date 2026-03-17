package com.condocompare.diagnostico.service;

import com.condocompare.common.exception.ResourceNotFoundException;
import com.condocompare.condominios.entity.Condominio;
import com.condocompare.condominios.repository.CondominioRepository;
import com.condocompare.diagnostico.dto.*;
import com.condocompare.seguros.entity.Apolice;
import com.condocompare.seguros.entity.Cobertura;
import com.condocompare.seguros.entity.TipoCobertura;
import com.condocompare.seguros.repository.ApoliceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DiagnosticoService {

    private final CondominioRepository condominioRepository;
    private final ApoliceRepository apoliceRepository;

    private static final Map<TipoCobertura, Integer> PESOS_COBERTURA = Map.ofEntries(
        Map.entry(TipoCobertura.INCENDIO, 15),
        Map.entry(TipoCobertura.RAIO, 10),
        Map.entry(TipoCobertura.EXPLOSAO, 10),
        Map.entry(TipoCobertura.DANOS_ELETRICOS, 10),
        Map.entry(TipoCobertura.VENDAVAL, 8),
        Map.entry(TipoCobertura.RESPONSABILIDADE_CIVIL, 12),
        Map.entry(TipoCobertura.RC_SINDICO, 8),
        Map.entry(TipoCobertura.RC_GUARDA_VEICULOS, 5),
        Map.entry(TipoCobertura.RC_PORTOES, 5),
        Map.entry(TipoCobertura.ROUBO, 5),
        Map.entry(TipoCobertura.VIDROS, 3),
        Map.entry(TipoCobertura.QUEBRA_MAQUINAS, 4),
        Map.entry(TipoCobertura.EQUIPAMENTOS_ELETRONICOS, 3),
        Map.entry(TipoCobertura.ALAGAMENTO, 2)
    );

    private static final Set<TipoCobertura> COBERTURAS_OBRIGATORIAS = Set.of(
        TipoCobertura.INCENDIO,
        TipoCobertura.RAIO,
        TipoCobertura.EXPLOSAO
    );

    @Transactional(readOnly = true)
    public DiagnosticoCompletoDTO gerarDiagnostico(UUID condominioId) {
        Condominio condominio = condominioRepository.findById(condominioId)
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        Apolice apolice = apoliceRepository.findApoliceVigenteByCondominio(condominioId)
            .orElseThrow(() -> new ResourceNotFoundException("Nenhuma apólice vigente encontrada para este condomínio"));

        return gerarDiagnosticoCompleto(condominio, apolice);
    }

    @Transactional(readOnly = true)
    public DiagnosticoCompletoDTO gerarDiagnosticoPorApolice(UUID apoliceId) {
        Apolice apolice = apoliceRepository.findById(apoliceId)
            .orElseThrow(() -> new ResourceNotFoundException("Apólice não encontrada"));

        Condominio condominio = apolice.getCondominio();
        return gerarDiagnosticoCompleto(condominio, apolice);
    }

    @Transactional(readOnly = true)
    public ScoreCoberturaDTO calcularScore(UUID condominioId) {
        Condominio condominio = condominioRepository.findById(condominioId)
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        Apolice apolice = apoliceRepository.findApoliceVigenteByCondominio(condominioId)
            .orElseThrow(() -> new ResourceNotFoundException("Nenhuma apólice vigente encontrada"));

        return calcularScoreCobertura(condominio, apolice);
    }

    private DiagnosticoCompletoDTO gerarDiagnosticoCompleto(Condominio condominio, Apolice apolice) {
        ScoreCoberturaDTO score = calcularScoreCobertura(condominio, apolice);
        AnaliseRiscoDTO analiseRisco = analisarRiscos(condominio, apolice);
        List<RecomendacaoDTO> recomendacoes = gerarRecomendacoes(condominio, apolice);
        List<CoberturaAnaliseDTO> coberturasAnalise = analisarCoberturas(condominio, apolice);
        ResumoDTO resumo = gerarResumo(apolice, recomendacoes);

        return new DiagnosticoCompletoDTO(
            condominio.getId(),
            condominio.getNome(),
            apolice.getId(),
            apolice.getNumeroApolice(),
            apolice.getSeguradora().getNome(),
            LocalDateTime.now(),
            score,
            analiseRisco,
            recomendacoes,
            coberturasAnalise,
            resumo
        );
    }

    private ScoreCoberturaDTO calcularScoreCobertura(Condominio condominio, Apolice apolice) {
        List<Cobertura> coberturas = apolice.getCoberturas();
        Set<TipoCobertura> coberturasContratadas = new HashSet<>();

        for (Cobertura c : coberturas) {
            if (c.isContratada()) {
                coberturasContratadas.add(c.getTipo());
            }
        }

        int pontuacaoTotal = 0;
        int pontuacaoMaxima = 0;
        List<ItemScoreDTO> detalhamento = new ArrayList<>();
        List<String> alertas = new ArrayList<>();

        for (Map.Entry<TipoCobertura, Integer> entry : PESOS_COBERTURA.entrySet()) {
            TipoCobertura tipo = entry.getKey();
            int peso = entry.getValue();
            pontuacaoMaxima += peso;

            boolean contratada = coberturasContratadas.contains(tipo);
            int pontuacao = contratada ? peso : 0;
            pontuacaoTotal += pontuacao;

            BigDecimal limiteAtual = coberturas.stream()
                .filter(c -> c.getTipo() == tipo && c.isContratada())
                .findFirst()
                .map(Cobertura::getLimiteMaximo)
                .orElse(BigDecimal.ZERO);

            BigDecimal limiteRecomendado = calcularLimiteRecomendado(tipo, condominio);
            String observacao = contratada ? "Contratada" : "Não contratada";

            if (contratada && limiteAtual.compareTo(BigDecimal.ZERO) > 0 &&
                limiteRecomendado.compareTo(BigDecimal.ZERO) > 0 &&
                limiteAtual.compareTo(limiteRecomendado) < 0) {
                observacao = "Limite abaixo do recomendado";
                pontuacaoTotal -= peso / 2;
            }

            detalhamento.add(new ItemScoreDTO(
                getCategoriaCobertura(tipo),
                tipo.name(),
                peso,
                pontuacao,
                peso,
                contratada,
                limiteAtual,
                limiteRecomendado,
                observacao
            ));

            if (COBERTURAS_OBRIGATORIAS.contains(tipo) && !contratada) {
                alertas.add("ALERTA CRÍTICO: Cobertura obrigatória não contratada: " + tipo.name());
            }
        }

        int scoreGeral = pontuacaoMaxima > 0 ? (pontuacaoTotal * 100) / pontuacaoMaxima : 0;
        scoreGeral = Math.max(0, Math.min(100, scoreGeral));

        int coberturasObrigatoriasFaltando = (int) COBERTURAS_OBRIGATORIAS.stream()
            .filter(tipo -> !coberturasContratadas.contains(tipo))
            .count();

        BigDecimal importanciaSegurada = apolice.getImportanciaSeguradaTotal() != null
            ? apolice.getImportanciaSeguradaTotal()
            : BigDecimal.ZERO;
        BigDecimal valorRecomendado = calcularValorRecomendado(condominio);
        BigDecimal gapValor = valorRecomendado.subtract(importanciaSegurada);

        if (gapValor.compareTo(BigDecimal.ZERO) > 0) {
            alertas.add("Importância segurada abaixo do valor recomendado. Gap: R$ " +
                gapValor.setScale(2, RoundingMode.HALF_UP));
        }

        return new ScoreCoberturaDTO(
            scoreGeral,
            ScoreCoberturaDTO.getClassificacao(scoreGeral),
            coberturasContratadas.size(),
            PESOS_COBERTURA.size(),
            coberturasObrigatoriasFaltando,
            importanciaSegurada,
            valorRecomendado,
            gapValor.compareTo(BigDecimal.ZERO) > 0 ? gapValor : BigDecimal.ZERO,
            detalhamento,
            alertas
        );
    }

    private AnaliseRiscoDTO analisarRiscos(Condominio condominio, Apolice apolice) {
        List<FatorRiscoDTO> fatoresRisco = new ArrayList<>();
        List<String> caracteristicas = new ArrayList<>();
        int scoreRisco = 30;

        if (condominio.getAnoConstrucao() != null) {
            int idade = java.time.Year.now().getValue() - condominio.getAnoConstrucao();
            caracteristicas.add("Idade do condomínio: " + idade + " anos");
            if (idade > 30) {
                scoreRisco += 15;
                fatoresRisco.add(new FatorRiscoDTO(
                    "Edificação antiga",
                    "ESTRUTURAL",
                    15,
                    "Construção com mais de 30 anos requer atenção especial",
                    temCobertura(apolice, TipoCobertura.DESMORONAMENTO)
                ));
            }
        }

        if (condominio.getNumeroElevadores() != null && condominio.getNumeroElevadores() > 0) {
            caracteristicas.add("Possui elevadores: " + condominio.getNumeroElevadores());
            scoreRisco += 10;
            fatoresRisco.add(new FatorRiscoDTO(
                "Elevadores",
                "EQUIPAMENTOS",
                10,
                "Elevadores requerem cobertura de responsabilidade civil e quebra de máquinas",
                temCobertura(apolice, TipoCobertura.QUEBRA_MAQUINAS)
            ));
        }

        if (Boolean.TRUE.equals(condominio.getTemPiscina())) {
            caracteristicas.add("Possui piscina");
            scoreRisco += 8;
            fatoresRisco.add(new FatorRiscoDTO(
                "Piscina",
                "AREAS_COMUNS",
                8,
                "Piscinas aumentam risco de acidentes - RC essencial",
                temCobertura(apolice, TipoCobertura.RESPONSABILIDADE_CIVIL)
            ));
        }

        if (Boolean.TRUE.equals(condominio.getTemAcademia())) {
            caracteristicas.add("Possui academia");
            scoreRisco += 5;
            fatoresRisco.add(new FatorRiscoDTO(
                "Academia",
                "AREAS_COMUNS",
                5,
                "Academia com equipamentos requer cobertura adequada",
                temCobertura(apolice, TipoCobertura.EQUIPAMENTOS_ELETRONICOS)
            ));
        }

        if (Boolean.TRUE.equals(condominio.getTemPlacasSolares())) {
            caracteristicas.add("Possui placas solares");
            scoreRisco += 5;
            fatoresRisco.add(new FatorRiscoDTO(
                "Placas solares",
                "EQUIPAMENTOS",
                5,
                "Equipamentos solares requerem cobertura específica",
                temCobertura(apolice, TipoCobertura.DANOS_ELETRICOS)
            ));
        }

        if (condominio.getNumeroAndares() != null && condominio.getNumeroAndares() > 10) {
            caracteristicas.add("Edifício alto: " + condominio.getNumeroAndares() + " andares");
            scoreRisco += 5;
            fatoresRisco.add(new FatorRiscoDTO(
                "Edificação alta",
                "ESTRUTURAL",
                5,
                "Edifícios altos têm maior exposição a vendaval e raios",
                temCobertura(apolice, TipoCobertura.VENDAVAL)
            ));
        }

        if (condominio.getNumeroFuncionarios() != null && condominio.getNumeroFuncionarios() > 0) {
            caracteristicas.add("Funcionários: " + condominio.getNumeroFuncionarios());
            scoreRisco += 5;
            fatoresRisco.add(new FatorRiscoDTO(
                "Funcionários próprios",
                "TRABALHISTA",
                5,
                "Necessário RC Empregador",
                temCobertura(apolice, TipoCobertura.RC_EMPREGADOR)
            ));
        }

        scoreRisco = Math.min(100, scoreRisco);

        return new AnaliseRiscoDTO(
            AnaliseRiscoDTO.getNivelRisco(scoreRisco),
            scoreRisco,
            fatoresRisco,
            caracteristicas,
            gerarObservacaoRisco(scoreRisco)
        );
    }

    private List<RecomendacaoDTO> gerarRecomendacoes(Condominio condominio, Apolice apolice) {
        List<RecomendacaoDTO> recomendacoes = new ArrayList<>();
        Set<TipoCobertura> coberturasContratadas = new HashSet<>();

        for (Cobertura c : apolice.getCoberturas()) {
            if (c.isContratada()) {
                coberturasContratadas.add(c.getTipo());
            }
        }

        for (TipoCobertura obrigatoria : COBERTURAS_OBRIGATORIAS) {
            if (!coberturasContratadas.contains(obrigatoria)) {
                recomendacoes.add(new RecomendacaoDTO(
                    "COBERTURA_FALTANTE",
                    "CRITICA",
                    "Contratar cobertura: " + obrigatoria.name(),
                    "Esta cobertura é considerada obrigatória para seguros condominiais",
                    "Solicitar inclusão imediata na próxima renovação ou endosso",
                    calcularImpactoFinanceiro(obrigatoria, condominio),
                    "Cobertura básica exigida em apólices condominiais"
                ));
            }
        }

        if (!coberturasContratadas.contains(TipoCobertura.RESPONSABILIDADE_CIVIL)) {
            recomendacoes.add(new RecomendacaoDTO(
                "COBERTURA_FALTANTE",
                "ALTA",
                "Contratar Responsabilidade Civil",
                "Protege o condomínio contra reclamações de terceiros",
                "Incluir RC com limite adequado ao porte do condomínio",
                new BigDecimal("5000.00"),
                "Essencial para proteção patrimonial do condomínio"
            ));
        }

        if (!coberturasContratadas.contains(TipoCobertura.RC_SINDICO)) {
            recomendacoes.add(new RecomendacaoDTO(
                "COBERTURA_FALTANTE",
                "ALTA",
                "Contratar RC Síndico",
                "Protege o síndico contra ações por erros de gestão",
                "Incluir cobertura específica para o síndico",
                new BigDecimal("2000.00"),
                "Fundamental para proteção do gestor condominial"
            ));
        }

        if (Boolean.TRUE.equals(condominio.getTemPiscina()) &&
            !coberturasContratadas.contains(TipoCobertura.RESPONSABILIDADE_CIVIL)) {
            recomendacoes.add(new RecomendacaoDTO(
                "MELHORIA",
                "ALTA",
                "RC para áreas com piscina",
                "Piscinas aumentam significativamente o risco de acidentes",
                "Garantir que o limite de RC seja adequado para cobrir acidentes em piscina",
                new BigDecimal("3000.00"),
                "Alto risco de acidentes em áreas aquáticas"
            ));
        }

        if ((condominio.getNumeroElevadores() != null && condominio.getNumeroElevadores() > 0) &&
            !coberturasContratadas.contains(TipoCobertura.QUEBRA_MAQUINAS)) {
            recomendacoes.add(new RecomendacaoDTO(
                "COBERTURA_FALTANTE",
                "MEDIA",
                "Contratar Quebra de Máquinas",
                "Cobertura para elevadores e outros equipamentos",
                "Incluir cobertura de quebra de máquinas para os " + condominio.getNumeroElevadores() + " elevadores",
                new BigDecimal("1500.00"),
                "Reparos de elevadores são caros"
            ));
        }

        if (condominio.getNumeroFuncionarios() != null && condominio.getNumeroFuncionarios() > 0 &&
            !coberturasContratadas.contains(TipoCobertura.RC_EMPREGADOR)) {
            recomendacoes.add(new RecomendacaoDTO(
                "COBERTURA_FALTANTE",
                "ALTA",
                "Contratar RC Empregador",
                "Protege contra ações trabalhistas",
                "Incluir para os " + condominio.getNumeroFuncionarios() + " funcionários",
                new BigDecimal("2500.00"),
                "Obrigatório quando há funcionários CLT"
            ));
        }

        BigDecimal importanciaSegurada = apolice.getImportanciaSeguradaTotal() != null
            ? apolice.getImportanciaSeguradaTotal()
            : BigDecimal.ZERO;
        BigDecimal valorRecomendado = calcularValorRecomendado(condominio);

        if (importanciaSegurada.compareTo(valorRecomendado.multiply(new BigDecimal("0.8"))) < 0) {
            BigDecimal diferenca = valorRecomendado.subtract(importanciaSegurada);
            recomendacoes.add(new RecomendacaoDTO(
                "LIMITE_INSUFICIENTE",
                "ALTA",
                "Aumentar importância segurada",
                "Valor atual está abaixo do recomendado para o patrimônio",
                "Revisar avaliação patrimonial e ajustar limite",
                diferenca.multiply(new BigDecimal("0.001")),
                "Importância segurada deve refletir valor de reconstrução"
            ));
        }

        recomendacoes.sort((a, b) -> {
            Map<String, Integer> prioridadeOrder = Map.of(
                "CRITICA", 0, "ALTA", 1, "MEDIA", 2, "BAIXA", 3
            );
            return prioridadeOrder.getOrDefault(a.prioridade(), 4)
                .compareTo(prioridadeOrder.getOrDefault(b.prioridade(), 4));
        });

        return recomendacoes;
    }

    private List<CoberturaAnaliseDTO> analisarCoberturas(Condominio condominio, Apolice apolice) {
        List<CoberturaAnaliseDTO> analises = new ArrayList<>();
        Map<TipoCobertura, Cobertura> coberturasMap = new HashMap<>();

        for (Cobertura c : apolice.getCoberturas()) {
            coberturasMap.put(c.getTipo(), c);
        }

        for (TipoCobertura tipo : TipoCobertura.values()) {
            Cobertura cobertura = coberturasMap.get(tipo);
            boolean contratada = cobertura != null && cobertura.isContratada();
            boolean obrigatoria = COBERTURAS_OBRIGATORIAS.contains(tipo);
            boolean recomendada = PESOS_COBERTURA.containsKey(tipo);

            BigDecimal limiteAtual = cobertura != null ? cobertura.getLimiteMaximo() : null;
            BigDecimal limiteRecomendado = calcularLimiteRecomendado(tipo, condominio);
            BigDecimal franquiaAtual = cobertura != null ? cobertura.getFranquia() : null;

            String statusLimite;
            String observacao;

            if (!contratada) {
                statusLimite = "NAO_CONTRATADA";
                observacao = obrigatoria ? "CRÍTICO: Cobertura obrigatória não contratada" :
                             recomendada ? "Recomendada para este tipo de condomínio" : "";
            } else if (limiteAtual == null || limiteRecomendado == null || limiteRecomendado.compareTo(BigDecimal.ZERO) == 0) {
                statusLimite = "ADEQUADO";
                observacao = "Cobertura contratada";
            } else if (limiteAtual.compareTo(limiteRecomendado.multiply(new BigDecimal("0.5"))) < 0) {
                statusLimite = "MUITO_ABAIXO";
                observacao = "Limite muito abaixo do recomendado";
            } else if (limiteAtual.compareTo(limiteRecomendado) < 0) {
                statusLimite = "ABAIXO_RECOMENDADO";
                observacao = "Limite abaixo do recomendado";
            } else {
                statusLimite = "ADEQUADO";
                observacao = "Limite adequado";
            }

            analises.add(new CoberturaAnaliseDTO(
                tipo,
                formatarNomeCobertura(tipo),
                contratada,
                obrigatoria,
                recomendada,
                limiteAtual,
                limiteRecomendado,
                franquiaAtual,
                statusLimite,
                observacao
            ));
        }

        return analises;
    }

    private ResumoDTO gerarResumo(Apolice apolice, List<RecomendacaoDTO> recomendacoes) {
        int totalCoberturas = TipoCobertura.values().length;
        int contratadas = (int) apolice.getCoberturas().stream()
            .filter(Cobertura::isContratada)
            .count();

        long criticas = recomendacoes.stream().filter(r -> "CRITICA".equals(r.prioridade())).count();
        long altas = recomendacoes.stream().filter(r -> "ALTA".equals(r.prioridade())).count();
        long medias = recomendacoes.stream().filter(r -> "MEDIA".equals(r.prioridade())).count();
        long baixas = recomendacoes.stream().filter(r -> "BAIXA".equals(r.prioridade())).count();

        BigDecimal valorMelhorias = recomendacoes.stream()
            .map(RecomendacaoDTO::impactoFinanceiro)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        String conclusao;
        if (criticas > 0) {
            conclusao = "ATENÇÃO: Existem " + criticas + " recomendações críticas que precisam ser resolvidas urgentemente.";
        } else if (altas > 2) {
            conclusao = "A apólice necessita de melhorias significativas. Recomenda-se revisão na próxima renovação.";
        } else if (altas > 0 || medias > 2) {
            conclusao = "A apólice está razoável, mas pode ser otimizada com algumas melhorias.";
        } else {
            conclusao = "A apólice está adequada para o perfil do condomínio.";
        }

        return new ResumoDTO(
            totalCoberturas,
            contratadas,
            totalCoberturas - contratadas,
            (int) criticas,
            (int) altas,
            (int) medias,
            (int) baixas,
            apolice.getPremioTotal(),
            valorMelhorias,
            conclusao
        );
    }

    private boolean temCobertura(Apolice apolice, TipoCobertura tipo) {
        return apolice.getCoberturas().stream()
            .anyMatch(c -> c.getTipo() == tipo && c.isContratada());
    }

    private BigDecimal calcularLimiteRecomendado(TipoCobertura tipo, Condominio condominio) {
        BigDecimal areaConstruida = condominio.getAreaConstruida() != null
            ? condominio.getAreaConstruida()
            : new BigDecimal("5000");
        BigDecimal valorM2 = new BigDecimal("3000");
        BigDecimal valorBase = areaConstruida.multiply(valorM2);

        return switch (tipo) {
            case INCENDIO, EXPLOSAO -> valorBase;
            case RAIO -> valorBase.multiply(new BigDecimal("0.3"));
            case DANOS_ELETRICOS -> valorBase.multiply(new BigDecimal("0.1"));
            case VENDAVAL -> valorBase.multiply(new BigDecimal("0.2"));
            case RESPONSABILIDADE_CIVIL -> new BigDecimal("500000");
            case RC_SINDICO -> new BigDecimal("200000");
            case RC_GUARDA_VEICULOS -> new BigDecimal("100000");
            case RC_PORTOES -> new BigDecimal("50000");
            case ROUBO -> new BigDecimal("50000");
            case VIDROS -> new BigDecimal("30000");
            case QUEBRA_MAQUINAS -> new BigDecimal("100000");
            case EQUIPAMENTOS_ELETRONICOS -> new BigDecimal("50000");
            default -> BigDecimal.ZERO;
        };
    }

    private BigDecimal calcularValorRecomendado(Condominio condominio) {
        BigDecimal areaConstruida = condominio.getAreaConstruida() != null
            ? condominio.getAreaConstruida()
            : new BigDecimal("5000");
        BigDecimal valorM2 = new BigDecimal("3500");
        return areaConstruida.multiply(valorM2);
    }

    private BigDecimal calcularImpactoFinanceiro(TipoCobertura tipo, Condominio condominio) {
        return switch (tipo) {
            case INCENDIO -> new BigDecimal("3000");
            case RAIO -> new BigDecimal("800");
            case EXPLOSAO -> new BigDecimal("1200");
            case RESPONSABILIDADE_CIVIL -> new BigDecimal("2500");
            default -> new BigDecimal("1000");
        };
    }

    private String getCategoriaCobertura(TipoCobertura tipo) {
        return switch (tipo) {
            case INCENDIO, RAIO, EXPLOSAO, FUMACA -> "BASICA";
            case DANOS_ELETRICOS, VENDAVAL, GRANIZO, IMPACTO_VEICULOS -> "DANOS";
            case RESPONSABILIDADE_CIVIL, RC_SINDICO, RC_GUARDA_VEICULOS, RC_PORTOES, RC_EMPREGADOR, DANOS_MORAIS -> "RC";
            case ROUBO, FURTO_QUALIFICADO -> "ROUBO";
            case QUEBRA_MAQUINAS, EQUIPAMENTOS_ELETRONICOS -> "EQUIPAMENTOS";
            default -> "OUTRAS";
        };
    }

    private String formatarNomeCobertura(TipoCobertura tipo) {
        return tipo.name().replace("_", " ");
    }

    private String gerarObservacaoRisco(int scoreRisco) {
        if (scoreRisco <= 30) {
            return "O condomínio apresenta baixo nível de risco. Manter coberturas básicas.";
        } else if (scoreRisco <= 50) {
            return "Nível de risco moderado. Recomenda-se atenção às coberturas específicas.";
        } else if (scoreRisco <= 70) {
            return "Nível de risco elevado. É importante revisar todas as coberturas recomendadas.";
        } else {
            return "Alto nível de risco. Revisão urgente da apólice é necessária.";
        }
    }
}
