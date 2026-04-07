from anthropic import Anthropic
from typing import List, Dict, Any
from src.config import settings

# Initialize Claude client
client = Anthropic(api_key=settings.anthropic_api_key)

SYSTEM_PROMPT_ASSISTENTE = """Voce e um assistente especialista em seguros de condominio no Brasil.
Seu nome e CondoCompare IA.

Voce ajuda sindicos, administradoras e corretoras a entender:
- Coberturas de seguro condominio (incendio, raio, explosao, danos eletricos, RC, etc)
- Franquias e como funcionam
- Processo de sinistros
- Comparacao entre propostas de seguradoras
- Obrigatoriedades legais (Lei 4591/64)
- Melhores praticas de gestao de risco

Diretrizes:
- Seja claro e objetivo
- Use linguagem acessivel, evite jargoes tecnicos desnecessarios
- Quando nao souber algo, diga que nao sabe
- Sempre mencione que e importante consultar um corretor especializado para decisoes finais
- Respostas em portugues brasileiro
- Nao invente informacoes sobre apolices especificas"""

SYSTEM_PROMPT_DIAGNOSTICO = """Voce e um analista especialista em seguros de condominio.
Sua funcao e analisar as caracteristicas de um condominio e suas coberturas de seguro,
identificando riscos, lacunas de cobertura e oportunidades de melhoria.

Ao analisar, considere:
1. Tipo de construcao (residencial, comercial, misto)
2. Amenidades (piscina, academia, elevadores, etc) e seus riscos associados
3. Numero de unidades e area construida
4. Coberturas obrigatorias por lei
5. Coberturas recomendadas baseadas no perfil do condominio
6. Valores de cobertura adequados

Formato da resposta deve ser estruturado em JSON."""

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
    """Analisa condominio e gera diagnostico"""

    prompt = f"""Analise o seguinte condominio e suas coberturas de seguro:

DADOS DO CONDOMINIO:
{format_condominio_data(condominio_data)}

COBERTURAS ATUAIS:
{format_coberturas(coberturas)}

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
