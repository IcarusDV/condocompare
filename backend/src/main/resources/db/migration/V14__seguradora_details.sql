-- V14: Add detailed fields to seguradoras for rules, specialties, and AI knowledge
ALTER TABLE condocompare.seguradoras
    ADD COLUMN IF NOT EXISTS descricao TEXT,
    ADD COLUMN IF NOT EXISTS especialidades TEXT[], -- Array of specialties
    ADD COLUMN IF NOT EXISTS regras TEXT[],          -- Array of rules/particularities
    ADD COLUMN IF NOT EXISTS ia_conhecimento TEXT[], -- Array of what the AI knows about this insurer
    ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS total_avaliacoes INTEGER DEFAULT 0;

-- Update seed data with realistic information
UPDATE condocompare.seguradoras SET
    descricao = 'Maior seguradora do Brasil em seguros patrimoniais. Referencia em seguro condominio com ampla rede de assistencia 24h e coberturas customizaveis.',
    especialidades = ARRAY['Seguro Condominio', 'Assistencia 24h', 'Cobertura Ampla', 'Grandes Riscos'],
    regras = ARRAY['Exige vistoria previa para condominios acima de 100 unidades', 'Franquia diferenciada para sinistros de agua', 'Cobertura de vidros apenas na modalidade completa', 'Desconto progressivo por tempo sem sinistro'],
    ia_conhecimento = ARRAY['Condicoes gerais atualizadas', 'Tabela de franquias por tipo de sinistro', 'Regras de aceitacao por perfil de condominio', 'Clausulas de exclusao mais comuns']
WHERE nome = 'Porto Seguro';

UPDATE condocompare.seguradoras SET
    descricao = 'Seguradora japonesa com forte presenca no Brasil. Conhecida pela agilidade na regulacao de sinistros e produtos flexiveis para condominios de todos os portes.',
    especialidades = ARRAY['Regulacao Agil', 'Condominios PME', 'Flexibilidade', 'Prevencao de Riscos'],
    regras = ARRAY['Aceita condominios sem vistoria ate 50 unidades', 'Franquia unica para todos os tipos de sinistro', 'Cobertura de responsabilidade civil inclusa no basico', 'Bonus de renovacao de ate 15%'],
    ia_conhecimento = ARRAY['Produtos disponiveis por regiao', 'Clausulas especificas para condominios verticais', 'Procedimentos de sinistro passo a passo', 'Comparativo de planos basico vs completo']
WHERE nome = 'Tokio Marine';

UPDATE condocompare.seguradoras SET
    descricao = 'Gigante global de seguros com expertise em grandes riscos. Oferece produtos robustos para condominios de alto padrao e complexos multiuso.',
    especialidades = ARRAY['Grandes Riscos', 'Alto Padrao', 'Condominios Mistos', 'Cobertura Internacional'],
    regras = ARRAY['Vistoria obrigatoria para todos os condominios', 'Franquia variavel conforme historico de sinistros', 'Exige laudo eletrico atualizado (max 5 anos)', 'Cobertura de equipamentos eletronicos como adicional'],
    ia_conhecimento = ARRAY['Requisitos de documentacao para contratacao', 'Coberturas adicionais disponiveis', 'Politica de renovacao e reajuste', 'Exclusoes especificas por tipo de condominio']
WHERE nome = 'Allianz';

UPDATE condocompare.seguradoras SET
    descricao = 'Uma das maiores seguradoras do pais, com forte integracao bancaria. Facilidade de pagamento e ampla rede de atendimento para condominios.',
    especialidades = ARRAY['Integracao Bancaria', 'Parcelamento Facilitado', 'Rede Ampla', 'Seguro Compreensivo'],
    regras = ARRAY['Desconto para clientes Bradesco correntistas', 'Franquia reduzida na renovacao sem sinistro', 'Cobertura de incendio obrigatoria como base', 'Vistoria exigida para importancia segurada acima de R$ 5M'],
    ia_conhecimento = ARRAY['Condicoes especiais para correntistas', 'Estrutura de coberturas e sublimites', 'Processo de acionamento de sinistro', 'Prazos e documentacao necessaria']
WHERE nome = 'Bradesco Seguros';

UPDATE condocompare.seguradoras SET
    descricao = 'Tradicao centenaria no mercado de seguros brasileiro. Destaque em atendimento humanizado e solucoes integradas de saude e patrimonial para condominios.',
    especialidades = ARRAY['Atendimento Humanizado', 'Solucoes Integradas', 'Experiencia Centenaria', 'Saude + Patrimonial'],
    regras = ARRAY['Pacote basico ja inclui responsabilidade civil do sindico', 'Franquia diferenciada por faixa de importancia segurada', 'Exige extintores e AVCB em dia', 'Desconto de 10% para condominios com CIPA'],
    ia_conhecimento = ARRAY['Pacotes pre-configurados por porte', 'Regras de aceitacao e restricoes', 'Coberturas obrigatorias vs opcionais', 'Historico de reajustes e tendencias']
WHERE nome = 'SulAmerica';

UPDATE condocompare.seguradoras SET
    descricao = 'Seguradora espanhola com solida presenca no Brasil. Reconhecida por produtos competitivos e processos simplificados de contratacao para condominios.',
    especialidades = ARRAY['Precos Competitivos', 'Processo Simplificado', 'Condominios Residenciais', 'Assistencia Completa'],
    regras = ARRAY['Contratacao 100% digital para condominios ate 80 unidades', 'Franquia fixa padronizada por regiao', 'Cobertura de danos eletricos inclusa no pacote intermediario', 'Renovacao automatica com aviso previo de 30 dias'],
    ia_conhecimento = ARRAY['Diferenciais competitivos vs concorrentes', 'Mapa de coberturas por plano', 'Regras de cancelamento e estorno', 'Assistencias incluidas e limites']
WHERE nome = 'Mapfre';

UPDATE condocompare.seguradoras SET
    descricao = 'Seguradora com forte atuacao no mercado brasileiro, integrando seguros patrimoniais e de vida.',
    especialidades = ARRAY['Seguro Patrimonial', 'Seguro Vida', 'Atendimento Nacional'],
    regras = ARRAY['Analise de risco detalhada para grandes condominios', 'Franquia padrao por tipo de sinistro'],
    ia_conhecimento = ARRAY['Produtos patrimoniais disponiveis', 'Processo de contratacao']
WHERE nome = 'Zurich' OR nome = 'Liberty Seguros' OR nome = 'HDI Seguros' OR nome = 'Sompo Seguros';
