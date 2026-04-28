from anthropic import Anthropic
from typing import List, Dict, Any
from src.config import settings

# Initialize Claude client
client = Anthropic(api_key=settings.anthropic_api_key)

SYSTEM_PROMPT_ASSISTENTE = """Voce e um assistente especialista em SEGURO CONDOMINIO no Brasil.
Seu nome e CondoCompare IA.

Voce ajuda sindicos, administradoras e corretoras a entender:
- Coberturas de seguro condominio (Incendio/Raio/Explosao, Vendaval, Danos Eletricos,
  Quebra de Vidros, Impacto de Veiculos, Roubo/Furto Qualificado, RC Condominio,
  RC Sindico, RC Guarda de Veiculos, Equipamentos Eletronicos, Cobertura de Vida em Grupo
  para funcionarios, Assistencia 24h, etc.)
- Franquias e como funcionam
- Processo de sinistros
- Comparacao entre propostas de seguradoras vinculadas ao sistema
- Obrigatoriedades legais (Lei 4.591/64) e convencoes coletivas regionais
- Melhores praticas de gestao de risco

ESCOPO IMPORTANTE:
- Seguro condominio cobre APENAS a estrutura comum (area comum) — nao cobre conteudo
  das unidades autonomas (apartamentos, lojas, salas).
- Conteudo individual de cada unidade e responsabilidade do condomeno via seguro residencial.

SEGURADORAS VINCULADAS AO SISTEMA:
Quando o usuario perguntar sobre uma seguradora ESPECIFICA (ex.: AXA, Allianz, Tokio Marine,
HDI, Chubb, Bradesco, Porto Seguro, SulAmerica, Zurich, Itau), priorize informacoes
das Condicoes Gerais cadastradas e do site oficial. Se nao tiver dado cadastrado para
aquela cia, deixe claro: "nao tenho informacoes especificas dessa seguradora cadastradas
no sistema; consulte o corretor para detalhes atualizados."

Diretrizes:
- Seja claro e objetivo
- Use a NOMENCLATURA oficial das coberturas (padrao SUSEP)
- Distinga area comum vs unidade autonoma sempre que relevante
- Quando nao souber algo, diga que nao sabe
- Sempre mencione que e importante consultar um corretor especializado para decisoes finais
- Respostas em portugues brasileiro
- Nao invente informacoes sobre apolices especificas"""

SYSTEM_PROMPT_DIAGNOSTICO = """Voce e um analista de risco especialista em SEGURO CONDOMINIO no Brasil.
Sua funcao e fazer GESTAO DE RISCO baseada nas caracteristicas estruturais do condominio,
sua vistoria e seus documentos cadastrais — identificando riscos, lacunas de cobertura
e oportunidades de melhoria para a AREA COMUM.

REGRAS FUNDAMENTAIS (siga rigorosamente):

1. ESCOPO DA COBERTURA - APENAS AREA COMUM:
   - O seguro condominio cobre EXCLUSIVAMENTE a estrutura comum do condominio
     (paredes externas, telhados, halls, garagens comuns, areas de lazer, elevadores, portaria, etc.)
   - NAO cobre o conteudo das unidades autonomas (apartamentos, lojas, salas)
   - NAO sugira coberturas relativas a moveis, eletrodomesticos, bens pessoais dos condomenos
   - Conteudo das unidades e responsabilidade individual do condomeno (seguro residencial separado)

2. NOMENCLATURA OFICIAL DE SEGURO CONDOMINIO:
   Use os nomes corretos das coberturas conforme padrao SUSEP:
   - Incendio, Raio e Explosao (cobertura basica)
   - Vendaval, Furacao, Ciclone, Tornado e Granizo
   - Danos Eletricos
   - Quebra de Vidros e Anuncios Luminosos
   - Impacto de Veiculos Terrestres
   - Roubo e/ou Furto Qualificado de Bens do Condominio
   - Despesas Fixas / Perda de Aluguel (apenas para conjunto comum)
   - Responsabilidade Civil do Condominio
   - Responsabilidade Civil do Sindico (D&O Sindico)
   - Responsabilidade Civil Guarda de Veiculos / Operacoes
   - Tumultos, Greves e Lockout
   - Equipamentos Eletronicos (porteiro eletronico, CFTV, central de alarme)
   - RC Portoes Automaticos
   - Quebra de Maquinas
   - Cobertura de Vida em Grupo / Acidentes Pessoais Coletivo (para funcionarios registrados — obrigatorio
     conforme convencao coletiva da regiao quando ha empregados CLT)
   - Assistencia 24h Condominio (encanador, eletricista, chaveiro, etc.)

3. DIVERSIFIQUE AS COBERTURAS:
   NAO foque tudo em Responsabilidade Civil. Distribua o diagnostico entre as familias de cobertura:
   patrimoniais, RC, equipamentos, vida (funcionarios), assistencia, fenomenos naturais.

4. CONSIDERE PARA O DIAGNOSTICO:
   - Tipo de construcao (residencial, comercial, horizontal, vertical, misto)
   - Idade do condominio (instalacoes antigas tem maior risco eletrico/hidraulico;
     se houver CNPJ, usar como referencia a data de fundacao registrada na Receita Federal
     quando o ano de construcao nao estiver disponivel)
   - Numero de pavimentos, blocos, unidades, area construida
   - Amenidades e seus riscos especificos:
     * Piscina -> RC piscina, danos a terceiros
     * Academia/Salao de Festas -> RC area comum, danos eletricos em equipamentos
     * Elevadores -> RC elevadores, manutencao preventiva
     * Garagem -> RC guarda de veiculos, sistemas de portao
     * Recarga de eletricos -> riscos eletricos especificos
     * Placas solares -> equipamentos eletronicos / vendaval
   - Funcionarios registrados -> Cobertura de Vida em Grupo OBRIGATORIA
     conforme convencao coletiva regional do Sindicato dos Empregados em Edificios
   - Sistemas de protecao contra incendio (extintores, hidrantes, sprinklers, AVCB)
   - Localizacao (regioes com risco de alagamento, vendaval, granizo)
   - Vistoria mais recente (apontamentos, nao conformidades, riscos identificados)

5. IDADE DO CONDOMINIO:
   Se o ano de construcao nao foi informado mas existe CNPJ, registre na recomendacao a
   sugestao de consultar a data de abertura na Receita Federal (publica) para estimar a idade
   da edificacao e ajustar coberturas adequadas para predios com mais de 30 anos.

Formato da resposta DEVE ser JSON estruturado conforme solicitado pelo prompt."""

SYSTEM_PROMPT_EXTRACAO = """Voce e um especialista em extracao de dados de documentos de seguro condominio.
Sua funcao e extrair dados estruturados de textos de apolices, orcamentos e propostas de seguro.

Extraia os dados no formato JSON solicitado. Seja preciso com valores monetarios e datas.
Se um dado nao estiver disponivel no texto, use null."""


async def chat_completion(
    messages: List[Dict[str, str]],
    system_prompt: str = SYSTEM_PROMPT_ASSISTENTE,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str:
    """Executa chat completion usando Claude API"""
    try:
        # Claude API usa 'system' separado dos messages
        # E não aceita role 'system' nos messages
        clean_messages = []
        for msg in messages:
            if msg["role"] != "system":
                clean_messages.append(msg)

        if not clean_messages:
            clean_messages = [{"role": "user", "content": "Olá"}]

        response = client.messages.create(
            model=settings.claude_model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=clean_messages,
            temperature=temperature,
        )

        return response.content[0].text
    except Exception as e:
        raise Exception(f"Erro ao chamar Claude: {str(e)}")


async def analyze_condominio(
    condominio_data: Dict[str, Any],
    coberturas: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Analisa condominio e gera diagnostico de gestao de risco.

    Quando `coberturas` esta vazio, o foco e 100% em GESTAO DE RISCO:
    avaliar caracteristicas, vistoria e documentos para apontar coberturas
    NECESSARIAS, riscos e cuidados — sem opinar sobre orcamentos.
    """

    sem_coberturas = not coberturas
    contexto_coberturas = (
        "NAO HA ORCAMENTOS/APOLICES PARA ANALISAR. Foque a analise nas caracteristicas\n"
        "do condominio para apontar quais coberturas sao OBRIGATORIAS, RECOMENDADAS\n"
        "e quais cuidados sao necessarios — independente de seguradora especifica.\n"
        "Os campos 'coberturas_adequadas' e 'coberturas_insuficientes' DEVEM ficar vazios.\n"
        "Use 'coberturas_ausentes' para listar TODAS as coberturas recomendadas com base no perfil."
        if sem_coberturas
        else f"COBERTURAS ATUAIS:\n{format_coberturas(coberturas)}"
    )

    prompt = f"""Faca a GESTAO DE RISCO do seguinte condominio (apenas area comum):

DADOS DO CONDOMINIO:
{format_condominio_data(condominio_data)}

{contexto_coberturas}

Gere um diagnostico completo em formato JSON com a seguinte estrutura:
{{
    "score": <numero de 0 a 100 indicando adequacao da cobertura>,
    "status": "<adequado|atencao|critico>",
    "coberturas_adequadas": ["lista de coberturas bem dimensionadas"],
    "coberturas_insuficientes": ["lista de coberturas com valor abaixo do recomendado"],
    "coberturas_ausentes": ["lista de coberturas recomendadas que nao estao presentes"],
    "riscos_identificados": [
        {{"risco": "descricao", "severidade": "alta|media|baixa", "mitigacao": "sugestao"}}
    ],
    "recomendacoes": [
        {{
            "tipo": "melhoria|alerta|cuidado",
            "categoria": "cobertura|valor|franquia|geral",
            "descricao": "descricao da recomendacao",
            "prioridade": <1-5 sendo 5 mais urgente>,
            "impacto": "descricao do impacto"
        }}
    ]
}}

Responda APENAS com o JSON, sem texto adicional."""

    response = await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        system_prompt=SYSTEM_PROMPT_DIAGNOSTICO,
        temperature=0.3,
        max_tokens=2000,
    )

    # Parse JSON response
    import json
    try:
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        return json.loads(response.strip())
    except json.JSONDecodeError:
        return {
            "score": 50,
            "status": "atencao",
            "coberturas_adequadas": [],
            "coberturas_insuficientes": [],
            "coberturas_ausentes": ["Nao foi possivel analisar as coberturas"],
            "riscos_identificados": [],
            "recomendacoes": [{
                "tipo": "alerta",
                "categoria": "geral",
                "descricao": "Nao foi possivel gerar analise completa. Consulte um corretor.",
                "prioridade": 3,
                "impacto": "Analise manual necessaria"
            }]
        }


async def extract_document_data(text: str, tipo: str) -> Dict[str, Any]:
    """Extrai dados estruturados de texto de documento usando Claude"""

    prompt = f"""Extraia os seguintes dados do texto de um documento de seguro do tipo {tipo}:

TEXTO DO DOCUMENTO:
{text[:8000]}

Retorne um JSON com a seguinte estrutura:
{{
    "seguradoraNome": "nome da seguradora",
    "valorPremio": <valor numerico do premio>,
    "dataVigenciaInicio": "YYYY-MM-DD",
    "dataVigenciaFim": "YYYY-MM-DD",
    "formaPagamento": "descricao da forma de pagamento",
    "coberturas": [
        {{
            "nome": "nome da cobertura",
            "valorLimite": <valor numerico>,
            "franquia": <valor numerico ou null>,
            "incluido": true
        }}
    ],
    "condominio_data": {{
        "cnpj": "XX.XXX.XXX/XXXX-XX",
        "endereco": "endereco completo",
        "cidade": "cidade",
        "estado": "UF",
        "cep": "XXXXX-XXX",
        "areaConstruida": <numero ou null>,
        "numeroUnidades": <numero ou null>,
        "numeroBlocos": <numero ou null>
    }}
}}

Se algum dado nao estiver no texto, use null. Valores monetarios devem ser numericos (sem R$).
Responda APENAS com o JSON."""

    response = await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        system_prompt=SYSTEM_PROMPT_EXTRACAO,
        temperature=0.1,
        max_tokens=3000,
    )

    import json
    try:
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        return json.loads(response.strip())
    except json.JSONDecodeError:
        return {}


def format_condominio_data(data: Dict[str, Any]) -> str:
    """Formata dados do condominio para o prompt"""
    lines = []

    if data.get("nome"):
        lines.append(f"- Nome: {data['nome']}")
    if data.get("tipoConstrucao"):
        lines.append(f"- Tipo: {data['tipoConstrucao']}")
    if data.get("numeroUnidades"):
        lines.append(f"- Unidades: {data['numeroUnidades']}")
    if data.get("numeroBlocos"):
        lines.append(f"- Blocos: {data['numeroBlocos']}")
    if data.get("numeroAndares"):
        lines.append(f"- Andares: {data['numeroAndares']}")
    if data.get("numeroElevadores"):
        lines.append(f"- Elevadores: {data['numeroElevadores']}")
    if data.get("areaConstruida"):
        lines.append(f"- Area Construida: {data['areaConstruida']} m2")
    if data.get("anoConstrucao"):
        lines.append(f"- Ano Construcao: {data['anoConstrucao']}")
    if data.get("anoFundacaoCNPJ") and not data.get("anoConstrucao"):
        idade = data.get("idadeViaCNPJ") or "N/A"
        lines.append(
            f"- Ano de fundacao do CNPJ (Receita Federal): {data['anoFundacaoCNPJ']} "
            f"(~{idade} anos) — usar como referencia da idade da edificacao quando o ano "
            f"de construcao nao foi informado"
        )
    if data.get("cnpj"):
        lines.append(f"- CNPJ: {data['cnpj']}")

    amenidades = []
    if data.get("temPiscina"):
        amenidades.append("Piscina")
    if data.get("temAcademia"):
        amenidades.append("Academia")
    if data.get("temSalaoFestas"):
        amenidades.append("Salao de Festas")
    if data.get("temPlayground"):
        amenidades.append("Playground")
    if data.get("temChurrasqueira"):
        amenidades.append("Churrasqueira")
    if data.get("temQuadra"):
        amenidades.append("Quadra")
    if data.get("temPortaria24h"):
        amenidades.append("Portaria 24h")
    if data.get("temPlacasSolares"):
        amenidades.append("Placas Solares")

    if amenidades:
        lines.append(f"- Amenidades: {', '.join(amenidades)}")

    return "\n".join(lines) if lines else "Dados nao disponiveis"


def format_coberturas(coberturas: List[Dict[str, Any]]) -> str:
    """Formata coberturas para o prompt"""
    if not coberturas:
        return "Nenhuma cobertura informada"

    lines = []
    for cob in coberturas:
        nome = cob.get("nome", "Cobertura")
        valor = cob.get("valorLimite")
        franquia = cob.get("franquia")

        line = f"- {nome}"
        if valor:
            line += f" | Limite: R$ {valor:,.2f}"
        if franquia:
            line += f" | Franquia: R$ {franquia:,.2f}"
        lines.append(line)

    return "\n".join(lines)
