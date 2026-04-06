-- Adicionar seguradora AXA
INSERT INTO condocompare.seguradoras (nome, cnpj, codigo_susep, descricao, especialidades, regras, ia_conhecimento) VALUES
    ('AXA', '36.542.459/0001-73', '0828',
     'Líder mundial em seguros e gestão de ativos. Forte atuação em seguros corporativos e condominiais, com soluções inovadoras de prevenção de riscos e gerenciamento de sinistros.',
     ARRAY['Seguros Corporativos', 'Gestão de Riscos', 'Prevenção', 'Condominios Comerciais'],
     ARRAY['Aceita condominios comerciais e mistos sem restrição de porte', 'Franquia fixa para sinistros de incêndio', 'Cobertura de responsabilidade civil do síndico inclusa', 'Desconto de até 20% para condominios com sistema de prevenção contra incêndio'],
     ARRAY['Condições gerais para condomínios residenciais e comerciais', 'Tabela de coberturas e sublimites', 'Processo de regulação de sinistros', 'Requisitos de vistoria e documentação']);
