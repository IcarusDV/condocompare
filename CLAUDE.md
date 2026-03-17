# CondoCompare

## Visao Geral

Plataforma para simplificar a analise e auxiliar na contratacao adequada de seguro condominio.
Objetivo: minimizar trabalho operacional atraves de importacao, extracao e integracao de documentos.

---

## Stack Tecnologica

| Camada | Tecnologia |
|--------|------------|
| Backend Core | Java 21 + Spring Boot 3 (modular) |
| IA Service | Python + FastAPI + LangChain |
| Banco Principal | PostgreSQL + pgvector |
| Frontend | React + TypeScript + Next.js |
| UI Components | MUI (Material UI) |
| Cache | Redis |
| Storage | MinIO (S3 compatible) |
| Mensageria | RabbitMQ (futuro) |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                   Next.js + React + MUI                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                │
│                   (Spring Cloud Gateway)                        │
└──────────┬─────────────────────────────────┬────────────────────┘
           │                                 │
           ▼                                 ▼
┌──────────────────────┐          ┌──────────────────────┐
│   BACKEND CORE       │          │   IA SERVICE         │
│   Spring Boot        │◄────────►│   FastAPI            │
│   (Monolito Modular) │          │   LangChain + RAG    │
└──────────┬───────────┘          └──────────┬───────────┘
           │                                 │
           ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                      INFRAESTRUTURA                              │
│  PostgreSQL + pgvector │ Redis │ MinIO │ RabbitMQ               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Modulos do Backend (condocompare-core)

```
condocompare-core/
├── auth/           # Autenticacao e autorizacao (JWT, OAuth2)
├── users/          # Gestao de usuarios e perfis
├── condominios/    # Cadastro e dados dos condominios
├── documentos/     # Importacao, extracao e armazenamento
├── seguros/        # Apolices, orcamentos, coberturas
├── diagnostico/    # Analises, cruzamentos, scores
├── vistorias/      # Vistorias digitais (basica, intermediaria, completa)
├── sinistros/      # Central de sinistros
├── parceiros/      # Marketplace de parceiros
├── ia/             # Integracao com servico IA
└── billing/        # Cobranca e assinaturas
```

---

## Perfis de Acesso (RBAC)

### Corretora
- Visao completa de todos condominios e administradoras
- Acesso a documentos importados
- Banco de dados e historico completo
- Vistorias e dados detalhados
- Central de sinistros com atualizacao diaria

### Administradora
- Visao apenas dos condominios que administra
- Acesso as funcoes principais
- Banco de dados e historico dos seus condominios

### Sindico
- Visao exclusiva do seu condominio
- Acesso as funcoes basicas
- Historico do seu condominio

---

## Funcionalidades Principais

### 1. Comparar Orcamentos
- Comparacao lado a lado
- Detalhamento de coberturas, franquias e valores
- Observacoes das diferencas

### 2. Analise de Apolice
- Cruzamento: Caracteristicas do Condominio x Coberturas x Condicoes Gerais
- Diagnostico de melhorias
- Coberturas nao contratadas
- Cuidados por seguradora

### 3. Diagnostico Tecnico
- Score de cobertura
- Dashboard com recomendacoes
- Relatorio tecnico resumido
- Sugestoes de outros seguros (Residencial, Prestamista, RC, Obras)

### 4. Vistoria Digital
- **Basica**: Fotos, videos, checklist com alertas
- **Intermediaria**: + Apontamentos tecnicos (pago)
- **Completa**: + Laudo tecnico (pago)

### 5. Central de Sinistros
- Acompanhamento em tempo real
- Historico de sinistros

### 6. Assistente IA
- Duvidas sobre coberturas e franquias
- Regras do seguro
- Analise de documentos

### 7. Parceiros
- Matching: necessidades x parceiros cadastrados
- Usa dados extraidos dos documentos

### 8. Historico
- Registro completo do condominio
- Importador de documentos

---

## Referencias para IA (RAG)

Documentos para indexacao:
- Apolices
- Propostas
- Orcamentos
- Legislacao
- Normativas (NRs)
- Condicoes Gerais das seguradoras
- Convencao Condominial
- Ata de Assembleia
- Contratos de manutencao

---

## Fases de Desenvolvimento

### Fase 1 - Core (MVP)
- [ ] Setup do projeto (monorepo)
- [ ] Autenticacao e autorizacao (RBAC)
- [ ] Cadastro de condominios
- [ ] Importacao de documentos (PDF)
- [ ] Extracao basica de dados
- [ ] Comparacao de orcamentos
- [ ] Historico

### Fase 2 - Inteligencia
- [ ] Servico de IA (RAG)
- [ ] Diagnostico tecnico
- [ ] Score de cobertura
- [ ] Assistente IA
- [ ] Relatorios inteligentes

### Fase 3 - Monetizacao
- [ ] Vistorias pagas
- [ ] Laudos tecnicos
- [ ] Marketplace de parceiros
- [ ] Billing por modulo
- [ ] White-label

---

## Estrutura do Repositorio

```
CondoCompare/
├── CLAUDE.md                    # Este arquivo
├── docker-compose.yml           # Infraestrutura local
├── .env.example                 # Variaveis de ambiente
│
├── backend/                     # Java + Spring Boot
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/condocompare/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── condominios/
│   │   │   │   ├── documentos/
│   │   │   │   ├── seguros/
│   │   │   │   ├── diagnostico/
│   │   │   │   ├── vistorias/
│   │   │   │   ├── sinistros/
│   │   │   │   ├── parceiros/
│   │   │   │   ├── ia/
│   │   │   │   └── billing/
│   │   │   └── resources/
│   │   └── test/
│   └── Dockerfile
│
├── ia-service/                  # Python + FastAPI
│   ├── pyproject.toml
│   ├── src/
│   │   ├── api/
│   │   ├── services/
│   │   ├── rag/
│   │   └── models/
│   └── Dockerfile
│
├── frontend/                    # Next.js + React
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── Dockerfile
│
└── docs/                        # Documentacao adicional
    ├── api/
    ├── arquitetura/
    └── regras-negocio/
```

---

## Comandos Uteis

```bash
# Subir infraestrutura local
docker-compose up -d

# Backend
cd backend && ./mvnw spring-boot:run

# IA Service
cd ia-service && uvicorn src.main:app --reload

# Frontend
cd frontend && npm run dev
```

---

## Variaveis de Ambiente

Veja `.env.example` para lista completa.

---

## Convencoes

### Codigo
- Backend: Java conventions + Google Style Guide
- Frontend: ESLint + Prettier
- IA: PEP8 + Black

### Git
- Commits: Conventional Commits (feat, fix, docs, refactor, test)
- Branches: feature/, bugfix/, hotfix/, release/

### API
- REST + OpenAPI 3.0
- Versionamento: /api/v1/

---

## Seguranca

- RBAC com roles e permissoes granulares
- Multi-tenant por condominio
- Auditoria de acoes criticas
- Logs imutaveis
- Criptografia de documentos sensiveis
- JWT com refresh token
- Rate limiting
