"""Vistoria (inspection) API endpoints - Laudo generation with AI"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from src.services.llm import chat_completion

router = APIRouter()


class VistoriaItemData(BaseModel):
    categoria: str
    descricao: str
    status: str  # CONFORME, NAO_CONFORME, PENDENTE
    severidade: Optional[str] = None
    observacao: Optional[str] = None


class GenerateLaudoRequest(BaseModel):
    condominio_nome: str
    condominio_endereco: Optional[str] = None
    condominio_tipo: Optional[str] = None
    tipo_vistoria: str  # BASICA, INTERMEDIARIA, COMPLETA
    data_vistoria: str
    responsavel_nome: Optional[str] = None
    itens: List[VistoriaItemData]
    observacoes: Optional[str] = None
    fotos_descricoes: List[str] = []
    nota_geral: Optional[int] = None


class GenerateLaudoResponse(BaseModel):
    laudo_texto: str
    success: bool
    message: str


LAUDO_SYSTEM_PROMPT = """Voce e um engenheiro/perito tecnico especializado em vistorias de condominios.
Sua funcao e gerar laudos tecnicos profissionais baseados nos dados de vistoria fornecidos.

O laudo deve seguir o padrao tecnico brasileiro e incluir:
1. Cabecalho com dados do condominio e da vistoria
2. Metodologia utilizada
3. Constatacoes detalhadas (itens conformes e nao conformes)
4. Analise critica dos pontos nao conformes
5. Recomendacoes tecnicas priorizadas
6. Conclusao com classificacao geral

Use linguagem tecnica mas acessivel. Seja objetivo e preciso.
Formate o laudo em Markdown para boa apresentacao."""


@router.post("/generate-laudo", response_model=GenerateLaudoResponse)
async def generate_laudo(request: GenerateLaudoRequest):
    """
    Gera um laudo tecnico de vistoria usando IA.
    """
    try:
        # Build summary of inspection items
        conformes = [i for i in request.itens if i.status == "CONFORME"]
        nao_conformes = [i for i in request.itens if i.status == "NAO_CONFORME"]
        pendentes = [i for i in request.itens if i.status == "PENDENTE"]

        itens_text = ""
        if nao_conformes:
            itens_text += "ITENS NAO CONFORMES:\n"
            for i in nao_conformes:
                itens_text += f"- [{i.categoria}] {i.descricao}"
                if i.severidade:
                    itens_text += f" (Severidade: {i.severidade})"
                if i.observacao:
                    itens_text += f" - Obs: {i.observacao}"
                itens_text += "\n"

        if conformes:
            itens_text += f"\nITENS CONFORMES ({len(conformes)} itens):\n"
            for i in conformes[:10]:  # Limit to first 10 for prompt size
                itens_text += f"- [{i.categoria}] {i.descricao}\n"
            if len(conformes) > 10:
                itens_text += f"... e mais {len(conformes) - 10} itens conformes\n"

        if pendentes:
            itens_text += f"\nITENS PENDENTES ({len(pendentes)} itens):\n"
            for i in pendentes:
                itens_text += f"- [{i.categoria}] {i.descricao}\n"

        fotos_text = ""
        if request.fotos_descricoes:
            fotos_text = "\nFOTOS REGISTRADAS:\n" + "\n".join(f"- {d}" for d in request.fotos_descricoes)

        prompt = f"""Gere um laudo tecnico completo para a seguinte vistoria de condominio:

DADOS DO CONDOMINIO:
- Nome: {request.condominio_nome}
- Endereco: {request.condominio_endereco or 'N/A'}
- Tipo: {request.condominio_tipo or 'N/A'}

DADOS DA VISTORIA:
- Tipo: {request.tipo_vistoria}
- Data: {request.data_vistoria}
- Responsavel: {request.responsavel_nome or 'N/A'}
- Total de itens: {len(request.itens)}
- Conformes: {len(conformes)}
- Nao conformes: {len(nao_conformes)}
- Pendentes: {len(pendentes)}
- Nota geral: {request.nota_geral or 'N/A'}%

{itens_text}
{fotos_text}

OBSERVACOES GERAIS:
{request.observacoes or 'Nenhuma'}

Gere o laudo tecnico completo em formato Markdown. Inclua:
1. **Cabecalho** com dados do condominio e vistoria
2. **Objetivo e Metodologia**
3. **Constatacoes** detalhadas com analise de cada nao conformidade
4. **Recomendacoes** priorizadas (urgente, curto prazo, medio prazo)
5. **Conclusao** com classificacao geral do condominio
"""

        response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=LAUDO_SYSTEM_PROMPT,
            temperature=0.4,
            max_tokens=3000,
        )

        return GenerateLaudoResponse(
            laudo_texto=response,
            success=True,
            message="Laudo gerado com sucesso",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar laudo: {str(e)}")
