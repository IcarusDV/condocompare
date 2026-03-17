package com.condocompare.documentos.entity;

public enum StatusProcessamento {
    PENDENTE,      // Aguardando processamento
    PROCESSANDO,   // Em processamento pela IA
    CONCLUIDO,     // Processamento concluído com sucesso
    ERRO           // Erro no processamento
}
