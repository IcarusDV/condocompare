package com.condocompare.parceiros.entity;

public enum CategoriaParceiro {
    ELEVADORES("Manutencao de Elevadores"),
    JARDINAGEM("Jardinagem e Paisagismo"),
    PORTARIA("Portaria e Seguranca"),
    LIMPEZA("Limpeza e Conservacao"),
    ELETRICA("Manutencao Eletrica"),
    HIDRAULICA("Manutencao Hidraulica"),
    PINTURA("Pintura"),
    ADVOCACIA("Advocacia"),
    CONTABILIDADE("Contabilidade"),
    BOMBEIRO_CIVIL("Bombeiro Civil"),
    DEDETIZACAO("Dedetizacao e Controle de Pragas"),
    IMPERMEABILIZACAO("Impermeabilizacao"),
    AR_CONDICIONADO("Ar Condicionado e Climatizacao"),
    PISCINA("Manutencao de Piscina"),
    GERADOR("Geradores e No-breaks"),
    INTERFONE("Interfone e Comunicacao"),
    CFTV("CFTV e Monitoramento"),
    INCENDIO("Sistema de Incendio"),
    GAS("Instalacao de Gas"),
    SERRALHERIA("Serralheria"),
    VIDRACARIA("Vidracaria"),
    TELHADO("Telhados e Coberturas"),
    SEGUROS("Corretora de Seguros"),
    ADMINISTRACAO("Administradora de Condominios"),
    OUTRO("Outros Servicos");

    private final String descricao;

    CategoriaParceiro(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
