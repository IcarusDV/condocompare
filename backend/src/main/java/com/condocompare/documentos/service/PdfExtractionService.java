package com.condocompare.documentos.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class PdfExtractionService {

    private static final DateTimeFormatter BR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // --- Known seguradoras ---
    private static final String[] SEGURADORAS = {
            "Porto Seguro", "Tokio Marine", "Bradesco Seguros", "SulAmérica", "SulAmerica",
            "Allianz", "Liberty", "Mapfre", "HDI", "Zurich", "Chubb", "AXA",
            "Sompo", "Alfa Seguros", "Excelsior", "Fairfax", "Generali",
            "Itaú Seguros", "Mitsui Sumitomo", "Pottencial", "Sancor", "Junto Seguros",
            "Too Seguros", "Yasuda", "Suhai", "Azul Seguros", "Yelum"
    };

    // --- Classification keyword sets ---
    private static final Map<String, List<String>> CLASSIFICATION_KEYWORDS = Map.of(
            "APOLICE", List.of("apólice", "apolice", "número da apólice", "numero da apolice",
                    "proposta de seguro", "vigência da apólice", "vigencia da apolice",
                    "certificado de seguro", "endosso"),
            "ORCAMENTO", List.of("orçamento", "orcamento", "cotação", "cotacao",
                    "prêmio total", "premio total", "proposta comercial",
                    "simulação", "simulacao", "valor do seguro"),
            "CONDICOES_GERAIS", List.of("condições gerais", "condicoes gerais", "cláusulas",
                    "clausulas", "disposições gerais", "disposicoes gerais",
                    "condições especiais", "condicoes especiais"),
            "LAUDO_VISTORIA", List.of("laudo", "vistoria", "inspeção", "inspecao",
                    "laudo técnico", "laudo tecnico", "relatório de vistoria",
                    "relatorio de vistoria"),
            "SINISTRO", List.of("sinistro", "aviso de sinistro", "ocorrência", "ocorrencia",
                    "regulação de sinistro", "regulacao de sinistro", "comunicação de sinistro")
    );

    // --- Coverage name patterns ---
    private static final String COVERAGE_NAMES_REGEX =
            "(?:incêndio|incendio|raio|explosão|explosao|" +
            "vendaval|granizo|fumaça|fumaca|" +
            "danos? el[ée]tricos?|danos? por [áa]gua|danos? mec[âa]nicos?|" +
            "responsabilidade civil|rc do s[íi]ndico|rc do condom[íi]nio|rc elevador|rc guarda|" +
            "roubo|furto qualificado|furto|subtração de bens|subtracao de bens|" +
            "quebra de vidros?|quebra de m[áa]quinas?|" +
            "alagamento|inundação|inundacao|transbordamento|" +
            "impacto de ve[íi]culos?|queda de aeronaves?|" +
            "despesas fixas|perda de aluguel|perda de receita|" +
            "desmoronamento|desabamento|" +
            "tumultos?|greve|lock[- ]?out|" +
            "equipamentos? eletr[ôo]nicos?|" +
            "vida|morte acidental|invalidez permanente|ipa|" +
            "portão|portao|porta automática|porta automatica|" +
            "anúncios luminosos|anuncios luminosos|" +
            "paisagismo|jardins?|" +
            "vazamento de tanques?|" +
            "remoção de entulhos?|remocao de entulhos?|" +
            "salvamento|combate a inc[êe]ndio|" +
            "rc (?:operações|operacoes)|" +
            "derramamento de sprinklers?|" +
            "vidros|espelhos|m[áa]rmores?)";

    /**
     * Extract all text from a PDF file using PDFBox.
     */
    public String extractText(byte[] fileBytes) {
        try (PDDocument document = Loader.loadPDF(fileBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            log.info("PDF text extracted: {} characters, {} pages", text.length(), document.getNumberOfPages());
            return text;
        } catch (Exception e) {
            log.error("Erro ao extrair texto do PDF: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Classify a document based on keywords found in the text and filename.
     */
    public String classifyDocument(String text, String filename) {
        if (text == null || text.isBlank()) {
            return "OUTRO";
        }

        String lowerText = text.toLowerCase();
        String lowerFilename = (filename != null) ? filename.toLowerCase() : "";

        // Score each type by counting keyword matches
        Map<String, Integer> scores = new LinkedHashMap<>();
        for (Map.Entry<String, List<String>> entry : CLASSIFICATION_KEYWORDS.entrySet()) {
            int score = 0;
            for (String keyword : entry.getValue()) {
                if (lowerText.contains(keyword.toLowerCase())) {
                    score++;
                }
                if (lowerFilename.contains(keyword.toLowerCase())) {
                    score += 2; // filename matches are weighted higher
                }
            }
            scores.put(entry.getKey(), score);
        }

        // Find the type with the highest score
        String bestType = "OUTRO";
        int bestScore = 0;
        for (Map.Entry<String, Integer> entry : scores.entrySet()) {
            if (entry.getValue() > bestScore) {
                bestScore = entry.getValue();
                bestType = entry.getKey();
            }
        }

        // Require at least 2 keyword matches to classify
        if (bestScore < 2) {
            return "OUTRO";
        }

        log.info("Documento classificado como {} (score={})", bestType, bestScore);
        return bestType;
    }

    /**
     * Extract structured data from the text based on the document type.
     * Returns a Map in the format expected by the existing system.
     */
    public Map<String, Object> extractData(String text, String tipo) {
        return extractData(text, tipo, null);
    }

    /**
     * Extract structured data from the text based on the document type.
     * Returns a Map in the format expected by the existing system.
     * @param filename original filename (used to improve seguradora detection)
     */
    public Map<String, Object> extractData(String text, String tipo, String filename) {
        if (text == null || text.isBlank()) {
            return Collections.emptyMap();
        }

        Map<String, Object> result = new HashMap<>();

        // Extract seguradora
        String seguradoraNome = extractSeguradora(text, filename);
        if (seguradoraNome != null) {
            result.put("seguradoraNome", seguradoraNome);
        }

        // Extract monetary values (premio) — prioriza extração do conteúdo do PDF (IA real lê o documento).
        // Filename é apenas fallback se o texto não tiver valor identificável.
        BigDecimal valorPremio = extractValorPremio(text);
        if (valorPremio == null) {
            valorPremio = extractValorPremioDoFilename(filename);
        }
        if (valorPremio != null) {
            result.put("valorPremio", valorPremio);
        }

        // Extract vigencia dates
        String vigenciaInicio = extractVigenciaInicio(text);
        String vigenciaFim = extractVigenciaFim(text);
        if (vigenciaInicio != null) {
            result.put("dataVigenciaInicio", vigenciaInicio);
        }
        if (vigenciaFim != null) {
            result.put("dataVigenciaFim", vigenciaFim);
        }

        // Extract coberturas for APOLICE and ORCAMENTO
        if ("APOLICE".equals(tipo) || "ORCAMENTO".equals(tipo)) {
            List<Map<String, Object>> coberturas = extractCoberturas(text);
            if (!coberturas.isEmpty()) {
                result.put("coberturas", coberturas);
            }
        }

        // Extract forma de pagamento
        String formaPagamento = extractFormaPagamento(text);
        if (formaPagamento != null) {
            result.put("formaPagamento", formaPagamento);
        }

        // Extract condominio data
        Map<String, Object> condominioData = extractCondominioData(text);
        if (!condominioData.isEmpty()) {
            result.put("condominio_data", condominioData);
        }

        log.info("Dados extraidos: {} campos, {} coberturas",
                result.size(),
                result.containsKey("coberturas") ? ((List<?>) result.get("coberturas")).size() : 0);

        return result;
    }

    // ============================
    // Private extraction methods
    // ============================

    private String extractSeguradora(String text, String filename) {
        // Priority 1: Check filename (users often name files like "Allianz - R$5.028,80.pdf")
        if (filename != null) {
            String lowerFilename = filename.toLowerCase();
            for (String seg : SEGURADORAS) {
                if (lowerFilename.contains(seg.toLowerCase())) {
                    return seg;
                }
            }
        }

        // Priority 2: Procurar a primeira seguradora CONHECIDA no texto, contando ocorrências
        // (a cia que aparece mais vezes no PDF é provavelmente a emissora — texto de outras
        // seguradoras pode aparecer como referência/comparação).
        String lowerText = text.toLowerCase();
        String melhor = null;
        int melhorContagem = 0;
        for (String seg : SEGURADORAS) {
            String alvo = seg.toLowerCase();
            int contagem = 0;
            int idx = 0;
            while ((idx = lowerText.indexOf(alvo, idx)) != -1) {
                contagem++;
                idx += alvo.length();
            }
            if (contagem > melhorContagem) {
                melhorContagem = contagem;
                melhor = seg;
            }
        }
        if (melhor != null) return melhor;

        // Priority 3: Label explícito como fallback (mas só se contiver uma cia conhecida)
        Pattern labelPattern = Pattern.compile(
                "(?i)(?:seguradora|companhia de seguros|cia\\.? de seguros|seguros s[./]a)\\s*:?\\s*([A-ZÀ-Ú][A-Za-zÀ-ú\\s&.]{3,60})",
                Pattern.UNICODE_CHARACTER_CLASS);
        Matcher m = labelPattern.matcher(text);
        if (m.find()) {
            String found = m.group(1).trim().replaceAll("\\s+", " ");
            String lowerFound = found.toLowerCase();
            for (String seg : SEGURADORAS) {
                if (lowerFound.contains(seg.toLowerCase())) {
                    return seg;
                }
            }
        }

        return null;
    }

    /**
     * Extrai valor do prêmio do nome do arquivo quando o usuário usa o padrão
     * "Seguradora - R$X.XXX,XX.pdf" (muito comum nos uploads). Mais confiável que
     * regex no texto, porque o PDF pode ter vários valores (parcelas, planos, etc.).
     */
    private BigDecimal extractValorPremioDoFilename(String filename) {
        if (filename == null) return null;
        Pattern p = Pattern.compile("R?\\$?\\s*([\\d.]+,[\\d]{2})");
        Matcher m = p.matcher(filename);
        if (m.find()) {
            BigDecimal v = parseBrazilianMoney(m.group(1));
            if (v != null && v.compareTo(new BigDecimal("100")) > 0) return v;
        }
        return null;
    }

    private BigDecimal extractValorPremio(String text) {
        // Strategy 0a: Tokio/Bradesco — tabela "Parcelas Parcela Juros Total" com o mesmo
        // valor repetido na coluna Total (linhas sem juros). Conta valores repetidos e
        // pega o que aparece pelo menos 6 vezes consecutivas (1x..6x sem juros).
        Pattern repeatedTotal = Pattern.compile("(?i)parcelas?\\s*parcela\\s*\\(R\\$\\)\\s*juros\\s*\\(%\\)\\s*total\\s*\\(R\\$\\)([\\s\\S]{0,2000})");
        Matcher rt = repeatedTotal.matcher(text);
        if (rt.find()) {
            String bloco = rt.group(1);
            // Conta ocorrências de cada valor monetário no bloco
            Matcher valMatcher = Pattern.compile("([\\d]{1,3}(?:\\.[\\d]{3})*,[\\d]{2})").matcher(bloco);
            Map<String, Integer> contagem = new HashMap<>();
            while (valMatcher.find()) {
                String v = valMatcher.group(1);
                contagem.merge(v, 1, Integer::sum);
            }
            // Pega o valor mais repetido (>= 4 ocorrências) com maior valor numérico
            BigDecimal melhor = null;
            int melhorContagem = 0;
            for (Map.Entry<String, Integer> e : contagem.entrySet()) {
                if (e.getValue() >= 4) {
                    BigDecimal v = parseBrazilianMoney(e.getKey());
                    if (v != null && v.compareTo(new BigDecimal("100")) > 0
                        && (e.getValue() > melhorContagem
                            || (e.getValue() == melhorContagem && melhor != null && v.compareTo(melhor) < 0))) {
                        melhor = v;
                        melhorContagem = e.getValue();
                    }
                }
            }
            if (melhor != null) return melhor;
        }

        // Strategy 0: Layout tabular "Prêmio Líquido IOF Prêmio Total" seguido de 3 valores em linha.
        // Captura o 3º valor (Prêmio Total). Comum em Chubb, Bradesco, etc.
        Pattern tabular3Cols = Pattern.compile(
            "(?is)pr[êe]mio\\s*l[íi]quido\\s+iof\\s+pr[êe]mio\\s*total[\\s\\S]{0,200}?" +
            "([\\d.]+,[\\d]{2})\\s+([\\d.]+,[\\d]{2})\\s+([\\d.]+,[\\d]{2})"
        );
        Matcher t3 = tabular3Cols.matcher(text);
        if (t3.find()) {
            BigDecimal val = parseBrazilianMoney(t3.group(3));
            if (val != null && val.compareTo(new BigDecimal("100")) > 0) {
                return val;
            }
        }

        // Strategy 1: Look for explicit "Total a pagar" or "Prêmio Total" (includes IOF)
        Pattern[] totalPatterns = {
                Pattern.compile("(?i)total\\s+a\\s+pagar\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
                Pattern.compile("(?i)(?:prêmio|premio)\\s*total\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
                Pattern.compile("(?i)(?:prêmio|premio)\\s*bruto\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
                Pattern.compile("(?i)total\\s+geral\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
                Pattern.compile("(?i)valor\\s+total\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
                Pattern.compile("(?i)valor\\s+total\\s+do\\s+seguro\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
                Pattern.compile("(?i)custo\\s+total\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
                Pattern.compile("(?i)custo\\s+total\\s+da\\s+ap[óo]lice\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
                Pattern.compile("(?i)pr[êe]mio\\s+total\\s+da\\s+ap[óo]lice\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
                Pattern.compile("(?i)valor\\s+do\\s+(?:prêmio|premio)\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
        };

        for (Pattern p : totalPatterns) {
            Matcher m = p.matcher(text);
            if (m.find()) {
                BigDecimal value = parseBrazilianMoney(m.group(1));
                if (value != null && value.compareTo(new BigDecimal("100")) > 0) {
                    return value;
                }
            }
        }

        // Strategy 2: Líquido + IOF = Total
        BigDecimal liquido = null;
        BigDecimal iof = null;

        Pattern liqPattern = Pattern.compile("(?i)(?:prêmio|premio)\\s*l[íi]quido\\s*(?:total|do local)?\\s*(?:-\\s*R\\$)?\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})");
        Matcher lm = liqPattern.matcher(text);
        if (lm.find()) {
            liquido = parseBrazilianMoney(lm.group(1));
        }

        // IOF: exige R$ ou contexto de valor monetário; rejeita formatos de alíquota (ex: "IOF: 7,38%")
        Pattern iofPattern = Pattern.compile("(?i)(?:valor\\s+do\\s+IOF|IOF\\s*[\\-:]?\\s*R\\$)\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})(?!\\s*%)");
        Matcher im = iofPattern.matcher(text);
        if (im.find()) {
            iof = parseBrazilianMoney(im.group(1));
        }

        if (liquido != null && iof != null) {
            return liquido.add(iof);
        }

        // Strategy 3: Prêmio líquido alone (with markup estimate for IOF ~7.38%)
        if (liquido != null) {
            // IOF seguro é 7.38% do líquido
            BigDecimal iofEstimado = liquido.multiply(new BigDecimal("0.0738")).setScale(2, java.math.RoundingMode.HALF_UP);
            return liquido.add(iofEstimado);
        }

        // Strategy 4: Try "Prêmio anual" or "Prêmio do seguro"
        Pattern[] fallbackPatterns = {
                Pattern.compile("(?i)(?:prêmio|premio)\\s*(?:anual|do\\s+seguro)\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
        };
        for (Pattern p : fallbackPatterns) {
            Matcher m = p.matcher(text);
            if (m.find()) {
                BigDecimal value = parseBrazilianMoney(m.group(1));
                if (value != null && value.compareTo(new BigDecimal("100")) > 0) {
                    return value;
                }
            }
        }

        return null;
    }

    private String extractVigenciaInicio(String text) {
        Pattern[] patterns = {
                // "Vigência: das 24h do dia 12/12/2024 às 24h do dia 12/12/2025"
                Pattern.compile("(?i)vig[êe]ncia\\s*:?\\s*(?:das\\s*)?(?:\\d+h\\s*)?(?:do\\s*)?dia\\s*(\\d{2}/\\d{2}/\\d{4})"),
                // Allianz: "Vigência: das 24H de 12/12/2025 às 24H de 12/12/2026"
                Pattern.compile("(?i)vig[êe]ncia\\s*:?\\s*das\\s*\\d+h\\s*de\\s*(\\d{2}/\\d{2}/\\d{4})"),
                // "De 12/12/2025 até 12/12/2026" or "De 12/12/2025 a 12/12/2026"
                Pattern.compile("(?i)\\bde\\s+(\\d{2}/\\d{2}/\\d{4})\\s*(?:até|ate|a)\\s*\\d{2}/\\d{2}/\\d{4}"),
                // HDI: "12/12/2025 até 12/12/2026" (sem "de" antes)
                Pattern.compile("(?i)(\\d{2}/\\d{2}/\\d{4})\\s+(?:até|ate)\\s+\\d{2}/\\d{2}/\\d{4}"),
                // AXA: "Início de vigência: 12/12/2025"
                Pattern.compile("(?i)in[íi]cio\\s*de\\s*vig[êe]ncia\\s*:?\\s*(\\d{2}/\\d{2}/\\d{4})"),
                // Chubb: layout tabular "Inicio de Vigência ... <linha> 12/12/2025 12/12/2026"
                Pattern.compile("(?is)in[íi]cio\\s*de\\s*vig[êe]ncia.{0,250}?\\b(\\d{2}/\\d{2}/\\d{4})\\b\\s*\\d{2}/\\d{2}/\\d{4}"),
                Pattern.compile("(?i)(?:in[íi]cio\\s*(?:da\\s*)?vig[êe]ncia|vig[êe]ncia\\s*(?:de|a\\s*partir\\s*de|in[íi]cio))\\s*:?\\s*(\\d{2}/\\d{2}/\\d{4})"),
                Pattern.compile("(?i)(?:in[íi]cio|vigente\\s+(?:a\\s+partir|desde))\\s*:?\\s*(\\d{2}/\\d{2}/\\d{4})"),
                Pattern.compile("(?i)vig[êe]ncia\\s*:?\\s*(\\d{2}/\\d{2}/\\d{4})\\s*(?:a|até|ate|-)\\s*\\d{2}/\\d{2}/\\d{4}"),
                Pattern.compile("(?i)per[íi]odo\\s*:?\\s*(\\d{2}/\\d{2}/\\d{4})\\s*(?:a|até|ate|-)\\s*\\d{2}/\\d{2}/\\d{4}"),
        };

        for (Pattern p : patterns) {
            Matcher m = p.matcher(text);
            if (m.find()) {
                return convertDateToIso(m.group(1));
            }
        }
        return null;
    }

    private String extractVigenciaFim(String text) {
        Pattern[] patterns = {
                // "das 24h do dia DD/MM/YYYY às 24h do dia DD/MM/YYYY"
                Pattern.compile("(?i)das\\s*\\d+h\\s*do\\s*dia\\s*\\d{2}/\\d{2}/\\d{4}\\s*[àa]s\\s*\\d+h\\s*do\\s*dia\\s*(\\d{2}/\\d{2}/\\d{4})"),
                // Allianz: "das 24H de DD/MM/YYYY às 24H de DD/MM/YYYY"
                Pattern.compile("(?i)das\\s*\\d+h\\s*de\\s*\\d{2}/\\d{2}/\\d{4}\\s*[àa]s\\s*\\d+h\\s*de\\s*(\\d{2}/\\d{2}/\\d{4})"),
                // "De 12/12/2025 até 12/12/2026"
                Pattern.compile("(?i)\\bde\\s+\\d{2}/\\d{2}/\\d{4}\\s*(?:até|ate|a)\\s*(\\d{2}/\\d{2}/\\d{4})"),
                // HDI: "12/12/2025 até 12/12/2026" (sem "de" antes)
                Pattern.compile("(?i)\\d{2}/\\d{2}/\\d{4}\\s+(?:até|ate)\\s+(\\d{2}/\\d{2}/\\d{4})"),
                // AXA: "Fim de vigência: 12/12/2026"
                Pattern.compile("(?i)fim\\s*de\\s*vig[êe]ncia\\s*:?\\s*(\\d{2}/\\d{2}/\\d{4})"),
                // Chubb: layout tabular "Inicio de Vigência ... <linha> 12/12/2025 12/12/2026"
                Pattern.compile("(?is)in[íi]cio\\s*de\\s*vig[êe]ncia.{0,250}?\\b\\d{2}/\\d{2}/\\d{4}\\s*(\\d{2}/\\d{2}/\\d{4})"),
                Pattern.compile("(?i)(?:t[ée]rmino|vencimento|fim)\\s*(?:da\\s*)?(?:vig[êe]ncia)?\\s*:?\\s*(\\d{2}/\\d{2}/\\d{4})"),
                Pattern.compile("(?i)vig[êe]ncia\\s*:?\\s*\\d{2}/\\d{2}/\\d{4}\\s*(?:a|até|ate|-)\\s*(\\d{2}/\\d{2}/\\d{4})"),
                Pattern.compile("(?i)per[íi]odo\\s*:?\\s*\\d{2}/\\d{2}/\\d{4}\\s*(?:a|até|ate|-)\\s*(\\d{2}/\\d{2}/\\d{4})"),
                Pattern.compile("(?i)(?:vigente\\s+até|validade\\s+até|válido\\s+até)\\s*:?\\s*(\\d{2}/\\d{2}/\\d{4})"),
        };

        for (Pattern p : patterns) {
            Matcher m = p.matcher(text);
            if (m.find()) {
                return convertDateToIso(m.group(1));
            }
        }
        return null;
    }

    private List<Map<String, Object>> extractCoberturas(String text) {
        List<Map<String, Object>> coberturas = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        // Strategy 1: Named coverage followed by R$ value
        Pattern coverageWithR$ = Pattern.compile(
                "(?im)(" + COVERAGE_NAMES_REGEX + "[^\\n]*?)\\s+R\\$\\s*([\\d.]+,[\\d]{2})",
                Pattern.UNICODE_CHARACTER_CLASS);

        Matcher m = coverageWithR$.matcher(text);
        while (m.find()) {
            addCobertura(coberturas, seen, m.group(1), m.group(m.groupCount()), text, m.start(), m.end());
        }

        // Strategy 2: Coverage name followed by bare number (no R$) - common in table formats
        // Pattern: "Incêndio, Raio, Explosão... 22.421.000,00 890,26"
        Pattern coverageBareNumber = Pattern.compile(
                "(?im)(" + COVERAGE_NAMES_REGEX + "[^\\n]*?)\\s+(\\d{1,3}(?:\\.\\d{3})*,\\d{2})\\s+(\\d{1,3}(?:\\.\\d{3})*,\\d{2})",
                Pattern.UNICODE_CHARACTER_CLASS);

        Matcher m2 = coverageBareNumber.matcher(text);
        while (m2.find()) {
            addCobertura(coberturas, seen, m2.group(1), m2.group(2), text, m2.start(), m2.end());
        }

        // Strategy 3: Table with multiple columns - just coverage + one number
        Pattern coverageSingleNumber = Pattern.compile(
                "(?im)^(" + COVERAGE_NAMES_REGEX + "[^\\n]{0,60}?)\\s{2,}(\\d{1,3}(?:\\.\\d{3})*,\\d{2})",
                Pattern.UNICODE_CHARACTER_CLASS);

        Matcher m3 = coverageSingleNumber.matcher(text);
        while (m3.find()) {
            addCobertura(coberturas, seen, m3.group(1), m3.group(2), text, m3.start(), m3.end());
        }

        return coberturas;
    }

    private void addCobertura(List<Map<String, Object>> coberturas, Set<String> seen,
                              String rawName, String rawValue, String text, int matchStart, int matchEnd) {
        String cleanName = cleanCoverageName(rawName);
        if (cleanName.length() < 3 || cleanName.length() > 120) return;

        // Skip entries that look like franquia descriptions, not coverages
        if (cleanName.toLowerCase().contains("% dos prejuízos") || cleanName.toLowerCase().contains("% dos prejuizos")
                || cleanName.toLowerCase().contains("limitado ao mínimo") || cleanName.toLowerCase().contains("limitado ao minimo")) {
            return;
        }

        BigDecimal valor = parseBrazilianMoney(rawValue);
        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) return;

        // Normalize key: remove numbers, extra spaces, and common suffixes for dedup
        String normalizedName = cleanName.toLowerCase()
                .replaceAll("\\d[\\d.,]*", "").trim()  // remove inline numbers
                .replaceAll("\\s+", " ");
        // Further simplify: take first few words as the key
        String[] words = normalizedName.split("\\s+");
        String key = String.join(" ", Arrays.copyOf(words, Math.min(words.length, 4)));

        if (seen.contains(key)) {
            // Already have this coverage - keep the one with the LARGER value (that's the limit, not premium)
            for (int i = 0; i < coberturas.size(); i++) {
                Map<String, Object> existing = coberturas.get(i);
                String existingKey = ((String) existing.get("nome")).toLowerCase()
                        .replaceAll("\\d[\\d.,]*", "").trim().replaceAll("\\s+", " ");
                String[] ew = existingKey.split("\\s+");
                String ek = String.join(" ", Arrays.copyOf(ew, Math.min(ew.length, 4)));
                if (ek.equals(key)) {
                    BigDecimal existingVal = (BigDecimal) existing.get("valorLimite");
                    if (valor.compareTo(existingVal) > 0) {
                        existing.put("valorLimite", valor);
                        existing.put("nome", cleanName);
                    }
                    break;
                }
            }
            return;
        }
        seen.add(key);

        Map<String, Object> cobertura = new LinkedHashMap<>();
        cobertura.put("nome", cleanName);
        cobertura.put("valorLimite", valor);
        cobertura.put("franquia", null);
        cobertura.put("incluido", true);

        BigDecimal franquia = findFranquiaNear(text, matchStart, matchEnd, cleanName);
        if (franquia != null) {
            cobertura.put("franquia", franquia);
        }

        coberturas.add(cobertura);
    }

    private BigDecimal findFranquiaNear(String text, int matchStart, int matchEnd, String coverageName) {
        // Look within ~500 chars after the coverage match
        int searchEnd = Math.min(text.length(), matchEnd + 500);
        String nearby = text.substring(matchEnd, searchEnd);

        // Strategy 1: "franquia" followed by R$ value
        Pattern franquiaR$ = Pattern.compile("(?i)franquia\\s*:?\\s*R\\$\\s*([\\d.]+,[\\d]{2})");
        Matcher fm = franquiaR$.matcher(nearby);
        if (fm.find()) {
            return parseBrazilianMoney(fm.group(1));
        }

        // Strategy 2: "franquia" followed by bare number
        Pattern franquiaBare = Pattern.compile("(?i)franquia\\s*:?\\s*(\\d{1,3}(?:\\.\\d{3})*,\\d{2})");
        fm = franquiaBare.matcher(nearby);
        if (fm.find()) {
            return parseBrazilianMoney(fm.group(1));
        }

        // Strategy 3: Look in global franquia section
        String firstWord = coverageName.toLowerCase().split("[,\\s]+")[0];
        if (firstWord.length() >= 4) {
            Pattern globalFranquia = Pattern.compile(
                    "(?i)" + Pattern.quote(firstWord) + "[^\\n]*?(?:franquia|FR)[^\\n]*?R\\$\\s*([\\d.]+,[\\d]{2})");
            Matcher gm = globalFranquia.matcher(text);
            if (gm.find()) {
                return parseBrazilianMoney(gm.group(1));
            }
        }

        return null;
    }

    private String cleanCoverageName(String rawName) {
        // Remove trailing dots, dashes, spaces, colons
        String name = rawName
                .replaceAll("[.…:]+$", "")
                .replaceAll("\\s+", " ")
                .replaceAll("^\\d+\\s*[-.)]+\\s*", "") // remove leading numbering like "1. " or "1) "
                .trim();

        // Capitalize first letter
        if (!name.isEmpty()) {
            name = name.substring(0, 1).toUpperCase() + name.substring(1);
        }
        return name;
    }

    private String extractFormaPagamento(String text) {
        String lowerText = text.toLowerCase();
        int maxParcelasSemJuros = 0;

        // Strategy 1: HDI tabela "Nx - VALOR1 VALOR2 - VALOR3...".
        // Quando VALOR1 == VALOR2 a linha é SEM juros — pega o maior N que satisfaz.
        Pattern hdiTabela = Pattern.compile("(?i)(\\d+)x\\s*-\\s*([\\d.]+,[\\d]{2})\\s+([\\d.]+,[\\d]{2})");
        Matcher hm = hdiTabela.matcher(text);
        int hdiMaxSemJuros = 0;
        while (hm.find()) {
            int n = Integer.parseInt(hm.group(1));
            String v1 = hm.group(2);
            String v2 = hm.group(3);
            if (n >= 1 && n <= 12 && v1.equals(v2) && n > hdiMaxSemJuros) {
                hdiMaxSemJuros = n;
            }
        }
        if (hdiMaxSemJuros > maxParcelasSemJuros) maxParcelasSemJuros = hdiMaxSemJuros;

        // Strategy 2: AXA style "0 + N boleto" - count how many unique "boleto" options
        // AXA shows plans: "1 + 5 boleto" = 6 parcelas. Take first block (sem juros)
        Pattern axaPattern = Pattern.compile("(?i)(\\d+)\\s*\\+\\s*(\\d+)\\s*boleto");
        Matcher am = axaPattern.matcher(text);
        int axaFirstBlock = 0;
        int axaCount = 0;
        while (am.find()) {
            int entry = Integer.parseInt(am.group(1));
            int remaining = Integer.parseInt(am.group(2));
            int total = entry + remaining;
            axaCount++;
            if (axaCount <= 6 && total >= 2 && total <= 12 && total > axaFirstBlock) {
                axaFirstBlock = total;
            }
        }
        // If AXA has 2 blocks (sem/com juros), first half is sem juros
        if (axaCount > 6) axaFirstBlock = 0; // reset, recalc
        if (axaCount > 6) {
            int half = axaCount / 2;
            am = axaPattern.matcher(text);
            int idx = 0;
            while (am.find()) {
                idx++;
                if (idx <= half) {
                    int t = Integer.parseInt(am.group(1)) + Integer.parseInt(am.group(2));
                    if (t >= 2 && t <= 12 && t > axaFirstBlock) axaFirstBlock = t;
                }
            }
        }
        if (axaFirstBlock > maxParcelasSemJuros) maxParcelasSemJuros = axaFirstBlock;

        // Strategy 3: Tokio - count "sem juros" lines (each = 1 parcela option)
        if (lowerText.contains("sem juros")) {
            int semJurosCount = 0;
            Matcher sjm = Pattern.compile("(?i)sem juros").matcher(text);
            while (sjm.find()) semJurosCount++;
            // Tokio duplicates tables, divide by 2
            if (semJurosCount > 6) semJurosCount = semJurosCount / 2;
            if (semJurosCount >= 2 && semJurosCount <= 12 && semJurosCount > maxParcelasSemJuros) {
                maxParcelasSemJuros = semJurosCount;
            }
        }

        // Strategy 4: Allianz/Chubb - look for "N parcelas" or parcelamento table
        Pattern parcelaPattern = Pattern.compile("(?i)(?:parcelamento|parcelas?)[\\s\\S]{0,300}?(\\d+)\\s*(?:x|parcelas?)");
        Matcher ptm = parcelaPattern.matcher(text);
        while (ptm.find()) {
            int n = Integer.parseInt(ptm.group(1));
            if (n >= 2 && n <= 12 && n > maxParcelasSemJuros) maxParcelasSemJuros = n;
        }

        // Strategy 5: Chubb - "plano" followed by installment counts
        Pattern chubbPattern = Pattern.compile("(?i)plano[\\s\\S]{0,500}?(\\d+)\\s*(?:x|parcelas?)");
        Matcher cm = chubbPattern.matcher(text);
        while (cm.find()) {
            int n = Integer.parseInt(cm.group(1));
            if (n >= 2 && n <= 12 && n > maxParcelasSemJuros) maxParcelasSemJuros = n;
        }

        if (maxParcelasSemJuros >= 2) {
            return "Até " + String.format("%02d", maxParcelasSemJuros) + "x sem juros no boleto";
        }

        if (lowerText.contains("à vista") || lowerText.contains("a vista")) {
            return "À vista";
        }

        return null;
    }

    private Map<String, Object> extractCondominioData(String text) {
        Map<String, Object> data = new HashMap<>();

        // CNPJ
        Pattern cnpjPattern = Pattern.compile("(\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2})");
        Matcher m = cnpjPattern.matcher(text);
        if (m.find()) {
            data.put("cnpj", m.group(1));
        }

        // CEP
        Pattern cepPattern = Pattern.compile("(\\d{5}-\\d{3})");
        m = cepPattern.matcher(text);
        if (m.find()) {
            data.put("cep", m.group(1));
        }

        // Address: "R 15 DE NOVEMBRO 643" or "Rua XV de Novembro, 643" or "Av. Brasil 1000"
        // Require the word after R./Rua/Av to be a number or uppercase word (street name)
        Pattern enderecoPattern = Pattern.compile(
                "(?im)((?:rua|r\\.\\s|av\\.?\\s|avenida|alameda|al\\.\\s|travessa|tv\\.\\s|praça|pça\\.\\s|estrada|rod\\.\\s)\\s*(?:\\d+|[A-ZÀ-Ú])[^\\n]{3,80}?(?:\\s+\\d{1,6})?)",
                Pattern.UNICODE_CHARACTER_CLASS);
        m = enderecoPattern.matcher(text);
        if (m.find()) {
            String endereco = m.group(1).trim();
            if (endereco.length() > 8 && !endereco.toLowerCase().contains("este negócio")
                    && !endereco.toLowerCase().contains("este negocio")
                    && !endereco.toLowerCase().contains("cobertura")) {
                data.put("endereco", endereco);
            }
        }

        // City/State - common formats: "Cidade - UF", "Cidade/UF", "Cidade - Estado"
        Pattern cidadeEstadoPattern = Pattern.compile(
                "(?i)(?:cidade|município|municipio|localidade)?\\s*:?\\s*([A-ZÀ-Ú][A-Za-zÀ-ú\\s]{2,30})\\s*[-/]\\s*([A-Z]{2})(?:\\s|\\n|$)",
                Pattern.UNICODE_CHARACTER_CLASS);
        m = cidadeEstadoPattern.matcher(text);
        if (m.find()) {
            String cidade = m.group(1).trim();
            String estado = m.group(2).trim().toUpperCase();
            if (isValidUf(estado)) {
                data.put("cidade", cidade);
                data.put("estado", estado);
            }
        }

        // Number of units
        Pattern unidadesPattern = Pattern.compile("(?i)(\\d+)\\s*(?:unidades?|apart(?:amentos?)?|salas?|conjuntos?)");
        m = unidadesPattern.matcher(text);
        if (m.find()) {
            try {
                int num = Integer.parseInt(m.group(1));
                if (num > 0 && num < 10000) {
                    data.put("numeroUnidades", num);
                }
            } catch (NumberFormatException ignored) {}
        }

        // Number of blocks/towers
        Pattern blocosPattern = Pattern.compile("(?i)(\\d+)\\s*(?:blocos?|torres?|edif[íi]cios?)");
        m = blocosPattern.matcher(text);
        if (m.find()) {
            try {
                int num = Integer.parseInt(m.group(1));
                if (num > 0 && num < 100) {
                    data.put("numeroBlocos", num);
                }
            } catch (NumberFormatException ignored) {}
        }

        // Built area
        Pattern areaPattern = Pattern.compile("(?i)(?:[áa]rea\\s*(?:constru[íi]da|total))\\s*:?\\s*([\\d.,]+)\\s*m[²2]?");
        m = areaPattern.matcher(text);
        if (m.find()) {
            try {
                String areaStr = m.group(1).replace(".", "").replace(",", ".");
                BigDecimal area = new BigDecimal(areaStr);
                if (area.compareTo(BigDecimal.ZERO) > 0) {
                    data.put("areaConstruida", area);
                }
            } catch (Exception ignored) {}
        }

        // Number of elevators
        Pattern elevadorPattern = Pattern.compile("(?i)(?:quantidade\\s*(?:de\\s*)?elevador(?:es)?|n[°º]?\\s*(?:de\\s*)?elevador(?:es)?)\\s*:?\\s*(\\d+)");
        m = elevadorPattern.matcher(text);
        if (m.find()) {
            data.put("numeroElevadores", Integer.parseInt(m.group(1)));
        } else {
            // "1 Elevador" or "01" after "elevadores?"
            Pattern elevSimple = Pattern.compile("(?i)(\\d+)\\s*elevador");
            m = elevSimple.matcher(text);
            if (m.find()) {
                data.put("numeroElevadores", Integer.parseInt(m.group(1)));
            }
        }

        // Number of pavimentos/andares
        Pattern pavPattern = Pattern.compile("(?i)(?:quantidade\\s*(?:de\\s*)?pavimentos?|n[°º]?\\s*(?:de\\s*)?pavimentos?)\\s*(?:[:(].*?)?\\s*(\\d+)");
        m = pavPattern.matcher(text);
        if (m.find()) {
            data.put("numeroPavimentos", Integer.parseInt(m.group(1)));
        } else {
            // "16 a 20" andares or "Acima de 15 andares"
            Pattern andPattern = Pattern.compile("(?i)(?:quantidade\\s*(?:de\\s*)?andar(?:es)?|n[°º]?\\s*andares?)\\s*:?\\s*(\\d+)");
            m = andPattern.matcher(text);
            if (m.find()) {
                data.put("numeroPavimentos", Integer.parseInt(m.group(1)));
            } else {
                Pattern andRange = Pattern.compile("(?i)(\\d+)\\s*(?:a\\s*\\d+)?\\s*andar");
                m = andRange.matcher(text);
                if (m.find()) {
                    data.put("numeroPavimentos", m.group(0).trim());
                }
            }
        }

        // Year/Age of construction
        Pattern anoConstrucaoPattern = Pattern.compile("(?i)(?:ano\\s*(?:de\\s*)?(?:constru[çc][ãa]o|fabrica[çc][ãa]o)|constru[íi]do\\s*(?:em)?)\\s*:?\\s*(\\d{4})");
        m = anoConstrucaoPattern.matcher(text);
        if (m.find()) {
            data.put("anoConstrucao", m.group(1));
        } else {
            // "Idade do Condomínio: De 06 a 10 anos"
            Pattern idadePattern = Pattern.compile("(?i)idade\\s*(?:do\\s*)?(?:condom[íi]nio|im[óo]vel)\\s*:?\\s*([^\\n]{3,40})");
            m = idadePattern.matcher(text);
            if (m.find()) {
                data.put("idadeConstrucao", m.group(1).trim());
            }
        }

        // Tipo/Enquadramento do condomínio
        Pattern tipoPattern = Pattern.compile("(?i)(?:tipo|enquadramento|classe|atividade)\\s*(?:do\\s*)?(?:condom[íi]nio|im[óo]vel|risco|edif[íi]cio)\\s*:?\\s*([^\\n]{3,60})");
        m = tipoPattern.matcher(text);
        if (m.find()) {
            data.put("tipoCondominio", m.group(1).trim());
        } else {
            String lt = text.toLowerCase();
            if (lt.contains("residencial") && lt.contains("comercial")) data.put("tipoCondominio", "Misto");
            else if (lt.contains("residencial")) data.put("tipoCondominio", "Residencial");
            else if (lt.contains("comercial")) data.put("tipoCondominio", "Comercial");
        }

        // Placas solares
        Pattern solarPattern = Pattern.compile("(?i)(?:placa|painel)\\s*solar");
        m = solarPattern.matcher(text);
        if (m.find()) {
            data.put("placaSolar", true);
        }

        // Bônus
        Pattern bonusPattern = Pattern.compile("(?i)(?:b[ôo]nus|sem\\s*sinistro)\\s*(?::)?\\s*([^\\n]{0,40})");
        m = bonusPattern.matcher(text);
        if (m.find()) {
            data.put("bonus", m.group(0).trim());
        }

        // Protecionais (extintores, hidrantes, alarmes)
        List<String> protecionais = new java.util.ArrayList<>();
        if (text.toLowerCase().contains("extintor")) protecionais.add("Extintores");
        if (text.toLowerCase().contains("hidrante")) protecionais.add("Hidrantes");
        if (text.toLowerCase().contains("alarme")) protecionais.add("Alarme");
        if (text.toLowerCase().contains("sprinkler")) protecionais.add("Sprinklers");
        if (text.toLowerCase().contains("detector")) protecionais.add("Detectores de Fumaça");
        if (!protecionais.isEmpty()) {
            data.put("protecionais", String.join(", ", protecionais));
        }

        // Funcionários
        Pattern funcPattern = Pattern.compile("(?i)(?:quantidade\\s*(?:de\\s*)?funcion[áa]rios?|n[°º]?\\s*(?:de\\s*)?funcion[áa]rios?)\\s*:?\\s*(\\d+)");
        m = funcPattern.matcher(text);
        if (m.find()) {
            data.put("numeroFuncionarios", Integer.parseInt(m.group(1)));
        }

        return data;
    }

    // ============================
    // Utility methods
    // ============================

    private BigDecimal parseBrazilianMoney(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            // Brazilian format: 1.234.567,89 -> 1234567.89
            String normalized = value.replace(".", "").replace(",", ".");
            BigDecimal result = new BigDecimal(normalized);
            return result.compareTo(BigDecimal.ZERO) > 0 ? result : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String convertDateToIso(String brDate) {
        if (brDate == null) return null;
        try {
            LocalDate date = LocalDate.parse(brDate, BR_DATE);
            return date.format(ISO_DATE);
        } catch (Exception e) {
            log.warn("Falha ao converter data: {}", brDate);
            return null;
        }
    }

    private boolean isValidUf(String uf) {
        Set<String> ufs = Set.of(
                "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
                "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
                "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"
        );
        return ufs.contains(uf);
    }
}
