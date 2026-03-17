package com.condocompare.vistorias.dto;

import com.condocompare.vistorias.entity.StatusVistoria;
import com.condocompare.vistorias.entity.TipoVistoria;
import com.condocompare.vistorias.entity.VistoriaItem;
import com.condocompare.vistorias.entity.VistoriaFoto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ExternalVistoriaResponse(
    UUID id,
    String condominioNome,
    TipoVistoria tipo,
    StatusVistoria status,
    LocalDateTime dataAgendada,
    LocalDateTime dataRealizada,
    String responsavelNome,
    String observacoes,
    String laudoTexto,
    LocalDateTime laudoGeradoEm,
    Integer notaGeral,
    Integer totalItens,
    Integer itensConformes,
    Integer itensNaoConformes,
    List<VistoriaItem> itens,
    List<VistoriaFoto> fotos,
    LocalDateTime createdAt
) {}
