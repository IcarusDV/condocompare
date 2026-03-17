from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID, uuid4
import io

from pypdf import PdfReader

from src.services.llm import chat_completion

router = APIRouter()


class CoberturaExtract(BaseModel):
    nome: str
    valorLimite: Optional[float] = None
    franquia: Optional[float] = None
    incluido: bool = True


class OrcamentoExtract(BaseModel):
    seguradoraNome: Optional[str] = None
    valorPremio: Optional[float] = None
    dataVigenciaInicio: Optional[str] = None
    dataVigenciaFim: Optional[str] = None
    formaPagamento: Optional[str] = None
    descontos: Optional[float] = None
    coberturas: List[CoberturaExtract] = []


class DocumentExtractionResponse(BaseModel):
    documento_id: Optional[UUID] = None
    tipo: str
    dados_extraidos: Dict[str, Any]
    chunks_created: int = 0
    status: str
    success: bool = True
    message: Optional[str] = None
    texto_extraido: Optional[str] = None


class DocumentAnalysisRequest(BaseModel):
    documento_id: UUID
    tipo_analise: str = "completa"


EXTRACTION_PROMPT_ORCAMENTO = """Voce e um assistente especializado em extrair dados estruturados de documentos de seguro de condominio.

Analise o texto abaixo e extraia as seguintes informacoes em formato JSON:

Para ORCAMENTOS de seguro, extraia:
- seguradoraNome: Nome da seguradora
- valorPremio: Valor total do premio (numerico, sem R$)
- dataVigenciaInicio: Data de inicio da vigencia (formato YYYY-MM-DD)
- dataVigenciaFim: Data de fim da vigencia (formato YYYY-MM-DD)
- formaPagamento: Forma de pagamento (ex: "12x sem juros", "A vista", etc)
- descontos: Percentual de desconto se houver (numerico)
- coberturas: Lista de coberturas com:
  - nome: Nome da cobertura
  - valorLimite: Limite de cobertura (numerico)
  - franquia: Valor da franquia (numerico)
  - incluido: true/false

IMPORTANTE:
- Extraia APENAS informacoes que estao explicitamente no texto
- Use null para campos nao encontrados
- Para valores monetarios, remova R$, pontos de milhar e use ponto para decimais
- Seja preciso com os nomes das coberturas

Responda APENAS com o JSON, sem explicacoes.

TEXTO DO DOCUMENTO:
{texto}
"""

EXTRACTION_PROMPT_CONDOMINIO = """Voce e um assistente especializado em extrair dados de condominios de documentos de seguro.

Analise o texto abaixo e extraia as seguintes informacoes do CONDOMINIO em formato JSON:

- nome: Nome completo do condominio (ex: "Condominio Residencial Solar das Palmeiras")
- cnpj: CNPJ do condominio (formato XX.XXX.XXX/XXXX-XX)
- endereco: Logradouro/Rua (ex: "Rua das Flores")
- numero: Numero do endereco
- bairro: Nome do bairro
- cidade: Nome da cidade
- estado: Sigla do estado (ex: "SP", "RJ")
- cep: CEP (formato XXXXX-XXX)
- areaConstruida: Area construida em metros quadrados (numerico)
- numeroUnidades: Quantidade de unidades/apartamentos (numerico)
- numeroBlocos: Quantidade de blocos/torres (numerico)
- seguradoraAtual: Nome da seguradora atual se mencionada
- vencimentoApolice: Data de vencimento da apolice atual (formato YYYY-MM-DD)

IMPORTANTE:
- Extraia APENAS informacoes que estao explicitamente no texto
- Use null para campos nao encontrados
- Para areas, use apenas o numero sem "m2"
- Procure por informacoes como "Segurado:", "Endereco:", "CNPJ:", etc.

Responda APENAS com o JSON, sem explicacoes.

TEXTO DO DOCUMENTO:
{texto}
"""


def extract_text_from_pdf(file_content: bytes) -> str:
    """Extrai texto de um PDF"""
    try:
        pdf_reader = PdfReader(io.BytesIO(file_content))
        text_parts = []
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        return "\n".join(text_parts)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler PDF: {str(e)}")


@router.post("/extract", response_model=DocumentExtractionResponse)
async def extract_document(
    file: UploadFile = File(...),
    tipo: str = "orcamento",
    condominio_id: Optional[UUID] = None,
):
    """
    Extrai dados de um documento (PDF)

    Tipos suportados:
    - orcamento: Orcamento de seguro
    - apolice: Apolice de seguro
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nome do arquivo nao informado")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF sao suportados")

    try:
        # Read file content
        content = await file.read()

        # Extract text from PDF
        texto = extract_text_from_pdf(content)

        if not texto.strip():
            raise HTTPException(status_code=400, detail="Nao foi possivel extrair texto do PDF")

        # Limit text size for LLM (first 15000 chars)
        texto_truncado = texto[:15000]

        # Use appropriate prompt based on type
        if tipo == "condominio":
            prompt = EXTRACTION_PROMPT_CONDOMINIO.format(texto=texto_truncado)
        else:
            prompt = EXTRACTION_PROMPT_ORCAMENTO.format(texto=texto_truncado)

        response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2000,
        )

        # Parse JSON response
        import json

        try:
            # Clean response (remove markdown code blocks if present)
            json_str = response.strip()
            if json_str.startswith("```"):
                json_str = json_str.split("\n", 1)[1]
            if json_str.endswith("```"):
                json_str = json_str.rsplit("```", 1)[0]
            json_str = json_str.strip()

            dados = json.loads(json_str)
        except json.JSONDecodeError:
            # If JSON parsing fails, return partial result
            dados = {"erro": "Nao foi possivel extrair dados estruturados", "texto_raw": texto_truncado[:1000]}

        return DocumentExtractionResponse(
            documento_id=None,
            tipo=tipo,
            dados_extraidos=dados,
            chunks_created=0,
            status="success",
            success=True,
            message="Dados extraidos com sucesso",
            texto_extraido=texto_truncado[:500] + "..." if len(texto) > 500 else texto,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar documento: {str(e)}")


class ClassifyRequest(BaseModel):
    texto: str
    nome_arquivo: Optional[str] = None


class ClassifyResponse(BaseModel):
    tipo: str
    confianca: float
    justificativa: Optional[str] = None


CLASSIFY_PROMPT = """Voce e um classificador de documentos de seguro de condominio.
Analise o texto abaixo e classifique o documento em UMA das seguintes categorias:

- APOLICE: Apolice de seguro (documento formal da seguradora com detalhes da cobertura vigente)
- ORCAMENTO: Orcamento ou proposta de seguro (cotacao com valores, coberturas oferecidas)
- CONDICOES_GERAIS: Condicoes gerais de seguro (regras, clausulas, definicoes gerais da seguradora)
- LAUDO_VISTORIA: Laudo de vistoria tecnica do imovel
- SINISTRO: Documento relacionado a sinistro (abertura, acompanhamento, laudo de sinistro)
- OUTRO: Documento que nao se encaixa nas categorias acima

Responda APENAS com JSON no formato:
{{"tipo": "CATEGORIA", "confianca": 0.95, "justificativa": "breve explicacao"}}

NOME DO ARQUIVO: {nome_arquivo}

TEXTO DO DOCUMENTO (primeiros 2000 caracteres):
{texto}
"""


@router.post("/classify", response_model=ClassifyResponse)
async def classify_document(request: ClassifyRequest):
    """
    Classifica automaticamente o tipo de um documento de seguro.
    """
    import json

    try:
        texto_truncado = request.texto[:2000]
        prompt = CLASSIFY_PROMPT.format(
            texto=texto_truncado,
            nome_arquivo=request.nome_arquivo or "desconhecido",
        )

        response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=200,
        )

        try:
            json_str = response.strip()
            if json_str.startswith("```"):
                json_str = json_str.split("\n", 1)[1]
            if json_str.endswith("```"):
                json_str = json_str.rsplit("```", 1)[0]
            json_str = json_str.strip()

            dados = json.loads(json_str)
            return ClassifyResponse(
                tipo=dados.get("tipo", "OUTRO"),
                confianca=float(dados.get("confianca", 0.5)),
                justificativa=dados.get("justificativa"),
            )
        except json.JSONDecodeError:
            return ClassifyResponse(tipo="OUTRO", confianca=0.3, justificativa="Falha na classificacao automatica")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao classificar documento: {str(e)}")


class ExtractTextRequest(BaseModel):
    texto: str
    tipo: str = "orcamento"


class ExtractTextResponse(BaseModel):
    tipo: str
    dados_extraidos: Dict[str, Any]
    success: bool = True
    message: Optional[str] = None


@router.post("/extract-text", response_model=ExtractTextResponse)
async def extract_from_text(request: ExtractTextRequest):
    """
    Extrai dados estruturados a partir de texto ja extraido do PDF.
    Usado pelo pipeline automatico (backend envia texto, nao arquivo).
    """
    import json

    try:
        texto_truncado = request.texto[:15000]

        if request.tipo.lower() in ("condominio",):
            prompt = EXTRACTION_PROMPT_CONDOMINIO.format(texto=texto_truncado)
        else:
            prompt = EXTRACTION_PROMPT_ORCAMENTO.format(texto=texto_truncado)

        response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2000,
        )

        try:
            json_str = response.strip()
            if json_str.startswith("```"):
                json_str = json_str.split("\n", 1)[1]
            if json_str.endswith("```"):
                json_str = json_str.rsplit("```", 1)[0]
            json_str = json_str.strip()

            dados = json.loads(json_str)
        except json.JSONDecodeError:
            dados = {"erro": "Nao foi possivel extrair dados estruturados"}

        return ExtractTextResponse(
            tipo=request.tipo,
            dados_extraidos=dados,
            success=True,
            message="Dados extraidos com sucesso",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao extrair dados: {str(e)}")


@router.post("/analyze")
async def analyze_document(request: DocumentAnalysisRequest):
    """
    Analisa um documento ja extraido
    """
    raise HTTPException(status_code=501, detail="Analise em desenvolvimento")


@router.get("/{documento_id}/embeddings")
async def get_document_embeddings(documento_id: UUID):
    """
    Retorna os embeddings de um documento
    """
    raise HTTPException(status_code=501, detail="Em desenvolvimento")
