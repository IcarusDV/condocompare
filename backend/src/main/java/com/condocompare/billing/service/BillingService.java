package com.condocompare.billing.service;

import com.condocompare.billing.dto.*;
import com.condocompare.billing.entity.Assinatura;
import com.condocompare.billing.entity.Plano;
import com.condocompare.billing.repository.AssinaturaRepository;
import com.condocompare.billing.repository.PlanoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final PlanoRepository planoRepository;
    private final AssinaturaRepository assinaturaRepository;

    // ===== Planos =====

    @Cacheable(value = "planos", key = "'all'")
    @Transactional(readOnly = true)
    public List<PlanoResponse> listPlanos() {
        return planoRepository.findByAtivoTrueOrderByOrdem().stream()
            .map(PlanoResponse::from)
            .toList();
    }

    @Cacheable(value = "planos", key = "#id")
    @Transactional(readOnly = true)
    public PlanoResponse getPlano(UUID id) {
        return PlanoResponse.from(planoRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Plano nao encontrado")));
    }

    // ===== Assinaturas =====

    @Transactional
    public AssinaturaResponse createAssinatura(UUID userId, CreateAssinaturaRequest request) {
        Plano plano = planoRepository.findById(request.planoId())
            .orElseThrow(() -> new EntityNotFoundException("Plano nao encontrado"));

        // Cancel existing active subscription
        assinaturaRepository.findByUserIdAndStatus(userId, "ATIVA")
            .ifPresent(existing -> {
                existing.setStatus("CANCELADA");
                existing.setDataCancelamento(LocalDate.now());
                assinaturaRepository.save(existing);
            });

        String tipoPagamento = request.tipoPagamento() != null ? request.tipoPagamento() : "MENSAL";
        BigDecimal valor = "ANUAL".equals(tipoPagamento) && plano.getPrecoAnual() != null
            ? plano.getPrecoAnual()
            : plano.getPrecoMensal();

        LocalDate dataInicio = LocalDate.now();
        LocalDate dataFim = "ANUAL".equals(tipoPagamento)
            ? dataInicio.plusYears(1)
            : dataInicio.plusMonths(1);

        Assinatura assinatura = Assinatura.builder()
            .userId(userId)
            .planoId(request.planoId())
            .status("ATIVA")
            .dataInicio(dataInicio)
            .dataFim(dataFim)
            .tipoPagamento(tipoPagamento)
            .valor(valor)
            .build();

        Assinatura saved = assinaturaRepository.save(assinatura);

        // Reload with plano data
        saved = assinaturaRepository.findById(saved.getId()).orElse(saved);
        return AssinaturaResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public AssinaturaResponse getAssinaturaAtiva(UUID userId) {
        return assinaturaRepository.findByUserIdAndStatus(userId, "ATIVA")
            .map(AssinaturaResponse::from)
            .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<AssinaturaResponse> getHistorico(UUID userId) {
        return assinaturaRepository.findByUserId(userId).stream()
            .map(AssinaturaResponse::from)
            .toList();
    }

    @Transactional
    public AssinaturaResponse cancelarAssinatura(UUID userId) {
        Assinatura assinatura = assinaturaRepository.findByUserIdAndStatus(userId, "ATIVA")
            .orElseThrow(() -> new EntityNotFoundException("Assinatura ativa nao encontrada"));

        assinatura.setStatus("CANCELADA");
        assinatura.setDataCancelamento(LocalDate.now());
        Assinatura saved = assinaturaRepository.save(assinatura);
        return AssinaturaResponse.from(saved);
    }
}
