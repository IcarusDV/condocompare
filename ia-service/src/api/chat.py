from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

from src.services.llm import chat_completion, SYSTEM_PROMPT_ASSISTENTE
from src.rag.store import search_chunks

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" ou "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    condominio_id: Optional[UUID] = None
    history: List[ChatMessage] = []
    context_type: str = "geral"  # geral, cobertura, franquia, sinistro


class ChatResponse(BaseModel):
    response: str
    sources: List[str] = []
    context_used: bool = False


CONTEXT_PROMPTS = {
    "geral": "",
    "cobertura": "\n\nO usuario esta perguntando especificamente sobre COBERTURAS de seguro. Foque sua resposta nesse tema.",
    "franquia": "\n\nO usuario esta perguntando sobre FRANQUIAS. Explique como funcionam as franquias em seguros de condominio.",
    "sinistro": "\n\nO usuario esta perguntando sobre SINISTROS. Explique o processo de abertura e acompanhamento de sinistros.",
    "comparacao": "\n\nO usuario veio da pagina de COMPARACAO DE ORCAMENTOS. Ajude-o a entender como comparar propostas de seguro, o que observar, e como escolher a melhor opcao.",
    "diagnostico": "\n\nO usuario veio da pagina de DIAGNOSTICO DE COBERTURA. Ajude-o a entender o score de cobertura, riscos identificados, e como melhorar a protecao do condominio.",
    "condominio": "\n\nO usuario veio da pagina de detalhes de um CONDOMINIO. Ajude-o a entender como as caracteristicas do condominio (idade, amenidades, numero de unidades) afetam o seguro.",
}


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Assistente IA para duvidas sobre seguros

    Tipos de contexto:
    - geral: Perguntas gerais sobre seguro condominio
    - cobertura: Duvidas sobre coberturas
    - franquia: Duvidas sobre franquias
    - sinistro: Duvidas sobre sinistros
    """
    try:
        # Build message history
        messages = []
        for msg in request.history[-10:]:  # Last 10 messages for context
            messages.append({"role": msg.role, "content": msg.content})

        # Try RAG: search for relevant document chunks with improved ranking
        rag_context = ""
        sources = []
        try:
            condominio_str = str(request.condominio_id) if request.condominio_id else None
            rag_results = search_chunks(
                query=request.message,
                condominio_id=condominio_str,
                limit=6,
                score_minimo=0.01,
            )
            if rag_results:
                # Use headline (highlighted snippets) when available, fallback to chunk_text
                rag_parts = []
                for r in rag_results:
                    tipo = r.get("tipo_documento", "OUTRO")
                    headline = r.get("headline", r["chunk_text"])
                    rag_parts.append(f"[{tipo}] {headline}")
                rag_context = "\n\nCONTEXTO DOS DOCUMENTOS DO CONDOMINIO (ordenados por relevancia):\n" + "\n\n---\n\n".join(rag_parts)
                sources = [
                    (r.get("headline") or r["chunk_text"])[:120] + "..."
                    for r in rag_results
                ]
        except Exception:
            pass  # RAG is optional, continue without it

        # Add current message
        user_message = request.message
        if rag_context:
            user_message = request.message + rag_context
        messages.append({"role": "user", "content": user_message})

        # Get context-specific system prompt addition
        context_addition = CONTEXT_PROMPTS.get(request.context_type, "")
        system_prompt = SYSTEM_PROMPT_ASSISTENTE + context_addition

        # Call LLM
        response = await chat_completion(
            messages=messages,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=1024,
        )

        return ChatResponse(
            response=response,
            sources=sources,
            context_used=request.context_type != "geral" or len(sources) > 0,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no chat: {str(e)}")


@router.post("/explain-coverage")
async def explain_coverage(cobertura: str, seguradora: Optional[str] = None):
    """
    Explica uma cobertura especifica
    """
    try:
        prompt = f"Explique de forma clara e objetiva a cobertura '{cobertura}' em seguros de condominio."
        if seguradora:
            prompt += f" Considere especificidades da seguradora {seguradora} se conhecidas."

        response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=800,
        )

        return {"cobertura": cobertura, "explicacao": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao explicar cobertura: {str(e)}")


@router.post("/compare-terms")
async def compare_terms(
    termo1: str,
    termo2: str,
):
    """
    Compara termos de seguros
    """
    try:
        prompt = f"""Compare os seguintes termos de seguro de condominio:

Termo 1: {termo1}
Termo 2: {termo2}

Explique as diferencas, quando usar cada um, e qual seria mais adequado em diferentes situacoes."""

        response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=800,
        )

        return {
            "termo1": termo1,
            "termo2": termo2,
            "comparacao": response,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao comparar termos: {str(e)}")


class CoberturaItem(BaseModel):
    nome: str
    valorLimite: Optional[float] = None
    franquia: Optional[float] = None
    incluido: bool = True


class OrcamentoItem(BaseModel):
    seguradora: str
    valorPremio: float
    coberturas: List[CoberturaItem]
    formaPagamento: Optional[str] = None
    descontos: Optional[float] = None


class ComparacaoRequest(BaseModel):
    orcamentos: List[OrcamentoItem]


class SinistroHelpRequest(BaseModel):
    tipo: str  # INCENDIO, ROUBO, DANOS_AGUA, etc.
    descricao: Optional[str] = None


@router.post("/sinistro-help")
async def get_sinistro_help(request: SinistroHelpRequest):
    """
    Gera orientacoes sobre proximos passos para um sinistro
    """
    try:
        prompt = f"""Voce e um especialista em sinistros de seguro de condominio.

Um usuario precisa de ajuda para abrir um sinistro do tipo: {request.tipo}
{f'Descricao: {request.descricao}' if request.descricao else ''}

Gere uma resposta em JSON com:
- "documentos_necessarios": lista de documentos que provavelmente serao exigidos pela seguradora
- "passos_imediatos": lista de 3-5 acoes que devem ser tomadas imediatamente
- "prazo_estimado": tempo estimado para conclusao (texto)
- "dicas": 2-3 dicas importantes para aumentar chances de aprovacao
- "cuidados": 1-2 coisas que NAO devem ser feitas

Responda APENAS com o JSON, sem explicacoes adicionais."""

        response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=1000,
        )

        # Parse JSON response
        import json
        try:
            json_str = response.strip()
            if json_str.startswith("```"):
                json_str = json_str.split("\n", 1)[1]
            if json_str.endswith("```"):
                json_str = json_str.rsplit("```", 1)[0]
            json_str = json_str.strip()

            dados = json.loads(json_str)
            return {"success": True, "data": dados}
        except json.JSONDecodeError:
            return {"success": False, "message": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar ajuda: {str(e)}")


@router.post("/analyze-comparacao")
async def analyze_comparacao(request: ComparacaoRequest):
    """
    Gera analise textual da comparacao de orcamentos
    """
    try:
        # Build a summary of the comparison data
        orcamentos_text = []
        for i, orc in enumerate(request.orcamentos, 1):
            coberturas_incluidas = [c.nome for c in orc.coberturas if c.incluido]
            text = f"""Orcamento {i} - {orc.seguradora}:
- Valor do Premio: R$ {orc.valorPremio:,.2f}
- Coberturas incluidas: {', '.join(coberturas_incluidas) if coberturas_incluidas else 'Nenhuma'}
- Forma de Pagamento: {orc.formaPagamento or 'Nao informada'}
- Desconto: {orc.descontos or 0}%"""
            orcamentos_text.append(text)

        prompt = f"""Analise os seguintes orcamentos de seguro para condominio e forneca uma analise textual detalhada comparando-os:

{chr(10).join(orcamentos_text)}

Por favor, analise:
1. Qual oferece o melhor custo-beneficio e porque
2. Diferencas importantes nas coberturas
3. Pontos de atencao que o cliente deve observar
4. Uma recomendacao final clara

Seja objetivo e direto na analise, use linguagem acessivel."""

        response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=1500,
        )

        return {"analise": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao analisar comparacao: {str(e)}")
