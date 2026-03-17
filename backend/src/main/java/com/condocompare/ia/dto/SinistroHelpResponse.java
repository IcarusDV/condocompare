package com.condocompare.ia.dto;

import java.util.List;
import java.util.Map;

public record SinistroHelpResponse(
    boolean success,
    SinistroHelpData data,
    String message
) {
    public record SinistroHelpData(
        List<String> documentosNecessarios,
        List<String> passosImediatos,
        String prazoEstimado,
        List<String> dicas,
        List<String> cuidados
    ) {}
}
