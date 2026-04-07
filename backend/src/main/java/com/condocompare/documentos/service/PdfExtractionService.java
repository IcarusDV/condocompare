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
        if (text == null || text.isBlank()) {
            return Collections.emptyMap();
        }

        Map<String, Object> result = new HashMap<>();

        // Extract seguradora
        String seguradoraNome = extractSeguradora(text);
        if (seguradoraNome != null) {
            result.put("seguradoraNome", seguradoraNome);
        }

        // Extract monetary values (premio)
        BigDecimal valorPremio = extractValorPremio(text);
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

    private String extractSeguradora(String text) {
        String lowerText = text.toLowerCase();
        for (String seg : SEGURADORAS) {
            if (lowerText.contains(seg.toLowerCase())) {
                return seg;
            }
        }
        // Try to find via CNPJ-based patterns or "Seguradora:" label
        Pattern segPattern = Pattern.compile(
                "(?i)(?:seguradora|companhia de seguros|cia\\. de seguros|seguros s[./]a)\\s*:?\\s*([A-ZÀ-Ú][A-Za-zÀ-ú\\s&.]+)",
                Pattern.UNICODE_CHARACTER_CLASS);
        Matcher m = segPattern.matcher(text);
        if (m.find()) {
            String found = m.group(1).trim();
            if (found.length() > 3 && found.length() < 80) {
                return found.replaceAll("\\s+", " ").trim();
            }
        }
        return null;
    }

    private BigDecimal extractValorPremio(String text) {
        Pattern[] premioPatterns = {
                // "Prêmio Líquido total 4.690,96" (sem R$)
                Pattern.compile("(?i)(?:prêmio|premio)\\s*(?:l[íi]quido)?\\s*(?:total)\\s*:?\\s*(?:R\\$)?\\s*([\\d.]+,[\\d]{2})"),
                // "Prêmio Total: R$ 5.037,14"
                Pattern.compile("(?i)(?:prêmio|premio)\\s*(?:total|l[íi]quido|anual|do seguro)\\s*:?\\s*R\\$\\s*([\\d.]+,[\\d]{2})"),
                // "Prêmio Total 5.037,14" (sem R$)
                Pattern.compile("(?i)(?:prêmio|premio)\\s*(?:total|l[íi]quido|anual|do seguro)\\s*:?\\s*([\\d.]+,[\\d]{2})"),
                // "Valor Total: R$ 5.037,14"
                Pattern.compile("(?i)(?:valor\\s+(?:total|do\\s+(?:prêmio|premio|seguro)))\\s*:?\\s*R\\$\\s*([\\d.]+,[\\d]{2})"),
                // "Total geral: R$ 5.037,14" or "Total a pagar: R$ 5.037,14"
                Pattern.compile("(?i)total\\s+(?:geral|a\\s+pagar)\\s*:?\\s*R\\$\\s*([\\d.]+,[\\d]{2})"),
                // "Total geral 5.037,14" (sem R$)
                Pattern.compile("(?i)total\\s+(?:geral|a\\s+pagar)\\s*:?\\s*([\\d.]+,[\\d]{2})"),
        };

        for (Pattern p : premioPatterns) {
            Matcher m = p.matcher(text);
            if (m.find()) {
                BigDecimal value = parseBrazilianMoney(m.group(1));
                if (value != null && value.compareTo(BigDecimal.ZERO) > 0) {
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
                // "De 12/12/2025 até 12/12/2026" or "De 12/12/2025 a 12/12/2026"
                Pattern.compile("(?i)\\bde\\s+(\\d{2}/\\d{2}/\\d{4})\\s*(?:até|ate|a)\\s*\\d{2}/\\d{2}/\\d{4}"),
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
                // "De 12/12/2025 até 12/12/2026"
                Pattern.compile("(?i)\\bde\\s+\\d{2}/\\d{2}/\\d{4}\\s*(?:até|ate|a)\\s*(\\d{2}/\\d{2}/\\d{4})"),
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
        Pattern[] patterns = {
                Pattern.compile("(?i)(?:forma\\s*(?:de)?\\s*pagamento|pagamento)\\s*:?\\s*([^\\n]{3,60})"),
                Pattern.compile("(?i)(\\d+)\\s*(?:x|parcelas?)\\s*(?:de)?\\s*R\\$\\s*[\\d.,]+"),
                Pattern.compile("(?i)(?:parcelamento|parcelas?)\\s*:?\\s*(\\d+)\\s*(?:x|vezes|parcelas?)"),
        };

        // Check for specific payment method keywords
        String lowerText = text.toLowerCase();
        if (lowerText.contains("à vista") || lowerText.contains("a vista")) {
            return "À vista";
        }

        Matcher m = patterns[0].matcher(text);
        if (m.find()) {
            String forma = m.group(1).trim();
            if (forma.length() > 3 && forma.length() < 60) {
                return forma;
            }
        }

        // Check for installments
        m = patterns[1].matcher(text);
        if (m.find()) {
            return m.group(0).trim();
        }

        m = patterns[2].matcher(text);
        if (m.find()) {
            return m.group(0).trim();
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
