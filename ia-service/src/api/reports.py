"""Reports API endpoints for generating technical reports with IA"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from src.services.llm import chat_completion

router = APIRouter()


class RecomendacaoInput(BaseModel):
    tipo: str
    categoria: str
    descricao: str
    prioridade: int
    impacto: str


class RiscoInput(BaseModel):
    risco: str
    severidade: str
    mitigacao: str


class DiagnosticoReportRequest(BaseModel):
    condominio_nome: Optional[str] = None
    condominio_id: Optional[str] = None
    score: float
    status: str
    coberturas_adequadas: List[str] = []
    coberturas_insuficientes: List[str] = []
    coberturas_ausentes: List[str] = []
    recomendacoes: List[RecomendacaoInput] = []
    riscos_identificados: List[RiscoInput] = []
    dados_condominio: Dict[str, Any] = {}


REPORT_SYSTEM_PROMPT = """Voce e um analista tecnico especialista em seguros de condominio no Brasil.
Sua funcao e gerar relatorios tecnicos profissionais e detalhados em formato Markdown.

Diretrizes:
- Use linguagem tecnica mas acessivel
- Inclua dados quantitativos quando disponíveis
- Organize o relatorio em secoes claras
- Faca recomendacoes actionaveis
- Use formatacao Markdown (titulos, listas, negrito, tabelas)
- Inclua data do relatorio
- O relatorio deve ser completo e autocontido
- Escreva em portugues brasileiro"""


@router.post("/diagnostico")
async def generate_diagnostico_report(request: DiagnosticoReportRequest):
    """
    Gera relatorio tecnico em Markdown a partir do diagnostico de cobertura.
    """
    try:
        # Build detailed context
        coberturas_text = ""
        if request.coberturas_adequadas:
            coberturas_text += f"\nCoberturas adequadas ({len(request.coberturas_adequadas)}):\n"
            coberturas_text += "\n".join(f"- {c}" for c in request.coberturas_adequadas)
        if request.coberturas_insuficientes:
            coberturas_text += f"\n\nCoberturas insuficientes ({len(request.coberturas_insuficientes)}):\n"
            coberturas_text += "\n".join(f"- {c}" for c in request.coberturas_insuficientes)
        if request.coberturas_ausentes:
            coberturas_text += f"\n\nCoberturas ausentes ({len(request.coberturas_ausentes)}):\n"
            coberturas_text += "\n".join(f"- {c}" for c in request.coberturas_ausentes)

        recomendacoes_text = ""
        if request.recomendacoes:
            recomendacoes_text = "\nRecomendacoes:\n"
            for rec in sorted(request.recomendacoes, key=lambda r: r.prioridade, reverse=True):
                recomendacoes_text += f"- [{rec.tipo.upper()}] (Prioridade {rec.prioridade}/5) {rec.descricao} | Impacto: {rec.impacto}\n"

        riscos_text = ""
        if request.riscos_identificados:
            riscos_text = "\nRiscos identificados:\n"
            for risco in request.riscos_identificados:
                riscos_text += f"- [{risco.severidade.upper()}] {risco.risco} | Mitigacao: {risco.mitigacao}\n"

        dados_condo_text = ""
        if request.dados_condominio:
            dados_condo_text = "\nDados do condominio:\n"
            for k, v in request.dados_condominio.items():
                if v:
                    dados_condo_text += f"- {k}: {v}\n"

        prompt = f"""Gere um relatorio tecnico profissional de DIAGNOSTICO DE COBERTURA DE SEGURO para o condominio.

DADOS DO DIAGNOSTICO:
- Condominio: {request.condominio_nome or 'Nao informado'}
- Score de cobertura: {request.score}/100
- Status: {request.status}
{dados_condo_text}
{coberturas_text}
{recomendacoes_text}
{riscos_text}

O relatorio deve conter as seguintes secoes em Markdown:
1. **Cabecalho** com titulo, data e identificacao do condominio
2. **Resumo Executivo** com score e status geral (2-3 paragrafos)
3. **Analise de Coberturas** com tabela mostrando status de cada cobertura
4. **Riscos Identificados** com classificacao por severidade
5. **Recomendacoes** ordenadas por prioridade com acoes concretas
6. **Plano de Acao** com proximos passos sugeridos
7. **Conclusao**

Use tabelas Markdown quando apropriado. Seja detalhado e profissional.
O relatorio sera exportado como PDF, entao use formatacao limpa."""

        response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=REPORT_SYSTEM_PROMPT,
            temperature=0.4,
            max_tokens=3000,
        )

        return {
            "success": True,
            "relatorio_markdown": response,
            "condominio_nome": request.condominio_nome,
            "score": request.score,
            "status": request.status,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao gerar relatorio: {str(e)}"
        )
