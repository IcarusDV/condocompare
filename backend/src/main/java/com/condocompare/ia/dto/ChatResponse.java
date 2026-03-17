package com.condocompare.ia.dto;

import java.util.List;

public record ChatResponse(
    String response,
    List<String> sources,
    boolean contextUsed
) {}
