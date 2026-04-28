from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from src.services.llm import chat_completion

router = APIRouter()


class CondominioInfo(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    tipoConstrucao: Optional[str] = None
    numeroUnidades: Optional[int] = None
    numeroBlocos: Optional[int] = None
    numeroAndares: Optional[int] = None
    numeroElevadores: Optional[int] = None
    areaConstruida: Optional[float] = None
    anoConstrucao: Optional[int] = None
    numeroFuncionarios: Optional[int] = None
    amenidades: Optional[Dict[str, Any]] = None


class ParceiroInfo(BaseModel):
    nome: str
    nomeFantasia: Optional[str] = None
    categorias: List[str] = []
    descricaoServicos: Optional[str] = None
    areaAtuacao: Optional[str] = None
    contatoNome: Optional[str] = None
    contatoCargo: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None


class GerarOfertaRequest(BaseModel):
    parceiro: ParceiroInfo
    condominio: CondominioInfo


class GerarOfertaResponse(BaseModel):
    texto: str


SYSTEM_PROMPT_OFERTA = """Voce e um assistente especialista em elaborar propostas comerciais
direcionadas para condominios no Brasil.

Sua tarefa: gerar uma OFERTA COMERCIAL personalizada de um prestador de servicos para
um condominio especifico, cruzando as categorias de servico do prestador com as
caracteristicas reais do condominio.

Diretrizes:
- Seja direto, profissional e objetivo. Maximo 250 palavras.
- Use tom comercial, mas sem exageros de marketing.
- Mencione caracteristicas REAIS do condominio (numero de unidades, elevadores, idade,
  amenidades) para justificar a oferta.
- Liste 3-5 itens concretos que o prestador entregaria, alinhados com as categorias dele
  e relevantes para o condominio.
- Termine com um chamado a acao discreto e os contatos do parceiro (se houver).
- Formato: texto puro com paragrafos curtos, NAO use markdown.
- Linguagem: portugues brasileiro."""


@router.post("/oferta", response_model=GerarOfertaResponse)
async def gerar_oferta(request: GerarOfertaRequest):
    """Gera uma oferta personalizada do parceiro para o condominio usando IA."""
    p = request.parceiro
    c = request.condominio

    am = c.amenidades or {}
    amenidades_ativas = [k for k, v in am.items() if v is True]

    prompt = f"""Gere uma proposta comercial personalizada do prestador para o condominio.

PRESTADOR:
- Nome: {p.nomeFantasia or p.nome}
- Categorias de servico: {', '.join(p.categorias) if p.categorias else 'nao informado'}
- Descricao: {p.descricaoServicos or 'nao informada'}
- Area de atuacao: {p.areaAtuacao or 'nao informada'}
- Contato: {p.contatoNome or '-'} {f"({p.contatoCargo})" if p.contatoCargo else ''}
- Telefone: {p.telefone or '-'}
- E-mail: {p.email or '-'}

CONDOMINIO:
- Nome: {c.nome}
- Localizacao: {c.cidade}/{c.estado}
- Tipo: {c.tipoConstrucao or 'nao informado'}
- Unidades: {c.numeroUnidades or 'nao informado'}
- Blocos: {c.numeroBlocos or 'nao informado'}
- Andares: {c.numeroAndares or 'nao informado'}
- Elevadores: {c.numeroElevadores or 'nao informado'}
- Area construida: {f'{c.areaConstruida} m2' if c.areaConstruida else 'nao informada'}
- Ano de construcao: {c.anoConstrucao or 'nao informado'}
- Funcionarios registrados: {c.numeroFuncionarios or 'nao informado'}
- Amenidades ativas: {', '.join(amenidades_ativas) if amenidades_ativas else 'nenhuma marcada'}

Gere a oferta em texto puro, no formato:
"Proposta personalizada para [Condominio]

[paragrafo introdutorio mencionando 1-2 caracteristicas do cond que justificam a oferta]

Servicos propostos:
- [item 1 alinhado as categorias do prestador e ao perfil do cond]
- [item 2]
- [item 3]
- [item 4 ou 5 se relevantes]

[paragrafo de fechamento + contato do parceiro]"

Responda APENAS com o texto da oferta, sem comentarios ou markdown."""

    try:
        texto = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=SYSTEM_PROMPT_OFERTA,
            temperature=0.5,
            max_tokens=900,
        )
        return GerarOfertaResponse(texto=texto.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar oferta: {str(e)}")
