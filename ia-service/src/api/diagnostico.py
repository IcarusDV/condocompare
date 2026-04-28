from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
import httpx

from src.config import settings
from src.services.llm import analyze_condominio

router = APIRouter()


class DiagnosticoRequest(BaseModel):
    condominio_id: UUID
    apolice_id: Optional[UUID] = None
    coberturas: List[Dict[str, Any]] = []
    dados_condominio: Optional[Dict[str, Any]] = None
    dados_orcamentos: Optional[List[Dict[str, Any]]] = None


class Recomendacao(BaseModel):
    tipo: str  # melhoria, alerta, cuidado
    categoria: str
    descricao: str
    prioridade: int  # 1-5
    impacto: str


class RiscoIdentificado(BaseModel):
    risco: str
    severidade: str  # alta, media, baixa
    mitigacao: str


class DiagnosticoResponse(BaseModel):
    condominio_id: UUID
    condominio_nome: Optional[str] = None
    score: float  # 0-100
    status: str  # adequado, atencao, critico
    coberturas_adequadas: List[str]
    coberturas_insuficientes: List[str]
    coberturas_ausentes: List[str]
    recomendacoes: List[Recomendacao]
    riscos_identificados: List[RiscoIdentificado]


class DiagnosticoSimplificadoRequest(BaseModel):
    nome: str
    tipo_construcao: Optional[str] = None
    numero_unidades: Optional[int] = None
    numero_blocos: Optional[int] = None
    numero_andares: Optional[int] = None
    numero_elevadores: Optional[int] = None
    area_construida: Optional[float] = None
    ano_construcao: Optional[int] = None
    tem_piscina: bool = False
    tem_academia: bool = False
    tem_salao_festas: bool = False
    tem_playground: bool = False
    tem_churrasqueira: bool = False
    tem_quadra: bool = False
    tem_portaria_24h: bool = False
    tem_placas_solares: bool = False
    coberturas: List[Dict[str, Any]] = []


@router.post("/analyze", response_model=DiagnosticoResponse)
async def diagnostico_condominio(request: DiagnosticoRequest):
    """
    Gera diagnostico completo do condominio cruzando:
    - Caracteristicas do condominio
    - Coberturas da apolice/orcamentos
    """
    try:
        condominio_data = {}
        condominio_nome = None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{settings.backend_url}/v1/condominios/{request.condominio_id}",
                )
                if response.status_code == 200:
                    data = response.json()
                    condominio_nome = data.get("nome")
                    caract = data.get("caracteristicas", {})
                    amenid = data.get("amenidades", {})
                    endereco = data.get("endereco", {})
                    seguro = data.get("seguro", {})
                    condominio_data = {
                        "nome": data.get("nome"),
                        "cnpj": data.get("cnpj"),
                        "endereco": f"{endereco.get('endereco', '')}, {endereco.get('numero', '')} - {endereco.get('bairro', '')}, {endereco.get('cidade', '')}/{endereco.get('estado', '')}".strip(", -/"),
                        "tipoConstrucao": caract.get("tipoConstrucao"),
                        "numeroUnidades": caract.get("numeroUnidades"),
                        "numeroBlocos": caract.get("numeroBlocos"),
                        "numeroAndares": caract.get("numeroAndares"),
                        "numeroElevadores": caract.get("numeroElevadores"),
                        "areaConstruida": caract.get("areaConstruida"),
                        "areaTotal": caract.get("areaTotal"),
                        "anoConstrucao": caract.get("anoConstrucao"),
                        "numeroFuncionarios": caract.get("numeroFuncionarios"),
                        "temPiscina": amenid.get("temPiscina"),
                        "temAcademia": amenid.get("temAcademia"),
                        "temSalaoFestas": amenid.get("temSalaoFestas"),
                        "temPlayground": amenid.get("temPlayground"),
                        "temChurrasqueira": amenid.get("temChurrasqueira"),
                        "temQuadra": amenid.get("temQuadra"),
                        "temPortaria24h": amenid.get("temPortaria24h"),
                        "temPlacasSolares": amenid.get("temPlacasSolares"),
                        "possuiAreaComercial": amenid.get("possuiAreaComercial"),
                        "tamanhoAreaComercial": amenid.get("tamanhoAreaComercial"),
                        "numPavimentos": amenid.get("numPavimentos"),
                        "possuiGaragem": amenid.get("possuiGaragem"),
                        "vagasGaragem": amenid.get("vagasGaragem"),
                        "espacosConveniencia": amenid.get("espacosConveniencia"),
                        "sistemaProtecaoIncendio": amenid.get("sistemaProtecaoIncendio"),
                        "possuiRecargaEletricos": amenid.get("possuiRecargaEletricos"),
                        "possuiBicicletario": amenid.get("possuiBicicletario"),
                        "numFuncionariosRegistrados": amenid.get("numFuncionariosRegistrados"),
                        "idadeFuncionariosRegistrados": amenid.get("idadeFuncionariosRegistrados"),
                        "seguradoraAtual": seguro.get("seguradoraAtual"),
                        "vencimentoApolice": seguro.get("vencimentoApolice"),
                        "diasParaVencimento": seguro.get("diasParaVencimento"),
                    }
        except Exception as e:
            print(f"Warning: Could not fetch condominio data: {e}")

        # Merge frontend-provided dados_condominio (fills gaps if backend fetch failed or has less data)
        if request.dados_condominio:
            for key, value in request.dados_condominio.items():
                if value is not None and not condominio_data.get(key):
                    condominio_data[key] = value
            if not condominio_nome and request.dados_condominio.get("nome"):
                condominio_nome = request.dados_condominio["nome"]

        # Se não há ano de construção mas há CNPJ, busca data de fundação na Receita Federal (BrasilAPI).
        # Usado pela IA como referência da idade da edificação para ajustar coberturas.
        cnpj = condominio_data.get("cnpj")
        if cnpj and not condominio_data.get("anoConstrucao"):
            try:
                cnpj_clean = "".join(c for c in cnpj if c.isdigit())
                if len(cnpj_clean) == 14:
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        resp = await client.get(f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_clean}")
                        if resp.status_code == 200:
                            cnpj_data = resp.json()
                            data_inicio = cnpj_data.get("data_inicio_atividade")
                            if data_inicio:
                                ano_fundacao = int(data_inicio[:4])
                                condominio_data["anoFundacaoCNPJ"] = ano_fundacao
                                condominio_data["idadeViaCNPJ"] = (
                                    __import__("datetime").datetime.now().year - ano_fundacao
                                )
            except Exception as e:
                print(f"Warning: nao foi possivel consultar Receita Federal: {e}")

        # Attach orcamento-level data (premios, vigencia, seguradoras) for richer analysis
        if request.dados_orcamentos:
            condominio_data["orcamentos_detalhados"] = request.dados_orcamentos

        coberturas = request.coberturas
        result = await analyze_condominio(condominio_data, coberturas)

        score = result.get("score", 50)
        if score >= 70:
            status = "adequado"
        elif score >= 40:
            status = "atencao"
        else:
            status = "critico"

        return DiagnosticoResponse(
            condominio_id=request.condominio_id,
            condominio_nome=condominio_nome,
            score=score,
            status=result.get("status", status),
            coberturas_adequadas=result.get("coberturas_adequadas", []),
            coberturas_insuficientes=result.get("coberturas_insuficientes", []),
            coberturas_ausentes=result.get("coberturas_ausentes", []),
            recomendacoes=[
                Recomendacao(**rec) for rec in result.get("recomendacoes", [])
            ],
            riscos_identificados=[
                RiscoIdentificado(**risco) for risco in result.get("riscos_identificados", [])
            ],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no diagnostico: {str(e)}")


@router.post("/analyze-direct", response_model=DiagnosticoResponse)
async def diagnostico_direto(request: DiagnosticoSimplificadoRequest):
    """
    Gera diagnostico com dados passados diretamente (sem buscar do backend)
    """
    try:
        condominio_data = {
            "nome": request.nome,
            "tipoConstrucao": request.tipo_construcao,
            "numeroUnidades": request.numero_unidades,
            "numeroBlocos": request.numero_blocos,
            "numeroAndares": request.numero_andares,
            "numeroElevadores": request.numero_elevadores,
            "areaConstruida": request.area_construida,
            "anoConstrucao": request.ano_construcao,
            "temPiscina": request.tem_piscina,
            "temAcademia": request.tem_academia,
            "temSalaoFestas": request.tem_salao_festas,
            "temPlayground": request.tem_playground,
            "temChurrasqueira": request.tem_churrasqueira,
            "temQuadra": request.tem_quadra,
            "temPortaria24h": request.tem_portaria_24h,
            "temPlacasSolares": request.tem_placas_solares,
        }

        result = await analyze_condominio(condominio_data, request.coberturas)
        score = result.get("score", 50)

        return DiagnosticoResponse(
            condominio_id=UUID("00000000-0000-0000-0000-000000000000"),
            condominio_nome=request.nome,
            score=score,
            status=result.get("status", "atencao"),
            coberturas_adequadas=result.get("coberturas_adequadas", []),
            coberturas_insuficientes=result.get("coberturas_insuficientes", []),
            coberturas_ausentes=result.get("coberturas_ausentes", []),
            recomendacoes=[
                Recomendacao(**rec) for rec in result.get("recomendacoes", [])
            ],
            riscos_identificados=[
                RiscoIdentificado(**risco) for risco in result.get("riscos_identificados", [])
            ],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no diagnostico: {str(e)}")


@router.get("/{condominio_id}/score")
async def get_score(condominio_id: UUID):
    """
    Retorna apenas o score de cobertura do condominio
    """
    try:
        request = DiagnosticoRequest(condominio_id=condominio_id)
        result = await diagnostico_condominio(request)
        return {
            "condominio_id": str(condominio_id),
            "score": result.score,
            "status": result.status,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter score: {str(e)}")
