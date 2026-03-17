from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import documents, chat, diagnostico, rag, vistoria, reports
from src.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting CondoCompare IA Service...")
    yield
    # Shutdown
    print("Shutting down CondoCompare IA Service...")


app = FastAPI(
    title="CondoCompare IA Service",
    description="Servico de IA para analise de documentos de seguro condominio",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(diagnostico.router, prefix="/api/v1/diagnostico", tags=["diagnostico"])
app.include_router(rag.router, prefix="/api/v1/rag", tags=["rag"])
app.include_router(vistoria.router, prefix="/api/v1/vistoria", tags=["vistoria"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "condocompare-ia"}


@app.get("/")
async def root():
    return {
        "service": "CondoCompare IA Service",
        "version": "0.1.0",
        "docs": "/docs",
    }
