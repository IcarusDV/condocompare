package com.condocompare.seguros.service;

import com.condocompare.common.exception.BusinessException;
import com.condocompare.common.exception.ResourceNotFoundException;
import com.condocompare.seguros.dto.CreateSeguradoraRequest;
import com.condocompare.seguros.dto.SeguradoraResponse;
import com.condocompare.seguros.dto.SeguradoraStatsResponse;
import com.condocompare.seguros.entity.Apolice;
import com.condocompare.seguros.entity.Seguradora;
import com.condocompare.seguros.entity.StatusApolice;
import com.condocompare.seguros.mapper.SeguroMapper;
import com.condocompare.seguros.repository.ApoliceRepository;
import com.condocompare.seguros.repository.SeguradoraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SeguradoraService {

    private final SeguradoraRepository seguradoraRepository;
    private final ApoliceRepository apoliceRepository;
    private final SeguroMapper seguroMapper;

    @Transactional
    public SeguradoraResponse create(CreateSeguradoraRequest request) {
        if (StringUtils.hasText(request.cnpj()) && seguradoraRepository.existsByCnpj(request.cnpj())) {
            throw new BusinessException("CNPJ já cadastrado");
        }

        Seguradora seguradora = seguroMapper.toSeguradora(request);
        seguradora = seguradoraRepository.save(seguradora);

        return seguroMapper.toSeguradoraResponse(seguradora);
    }

    @Transactional
    public SeguradoraResponse update(UUID id, CreateSeguradoraRequest request) {
        Seguradora seguradora = findEntityById(id);

        if (StringUtils.hasText(request.cnpj()) && !request.cnpj().equals(seguradora.getCnpj())) {
            if (seguradoraRepository.existsByCnpj(request.cnpj())) {
                throw new BusinessException("CNPJ já cadastrado");
            }
            seguradora.setCnpj(request.cnpj());
        }

        if (StringUtils.hasText(request.nome())) {
            seguradora.setNome(request.nome());
        }
        if (request.codigoSusep() != null) {
            seguradora.setCodigoSusep(request.codigoSusep());
        }
        if (request.telefone() != null) {
            seguradora.setTelefone(request.telefone());
        }
        if (request.email() != null) {
            seguradora.setEmail(request.email());
        }
        if (request.website() != null) {
            seguradora.setWebsite(request.website());
        }
        if (request.enderecoCompleto() != null) {
            seguradora.setEnderecoCompleto(request.enderecoCompleto());
        }
        if (request.logoUrl() != null) {
            seguradora.setLogoUrl(request.logoUrl());
        }
        if (request.observacoes() != null) {
            seguradora.setObservacoes(request.observacoes());
        }
        if (request.descricao() != null) {
            seguradora.setDescricao(request.descricao());
        }
        if (request.especialidades() != null) {
            seguradora.setEspecialidades(request.especialidades().toArray(new String[0]));
        }
        if (request.regras() != null) {
            seguradora.setRegras(request.regras().toArray(new String[0]));
        }
        if (request.iaConhecimento() != null) {
            seguradora.setIaConhecimento(request.iaConhecimento().toArray(new String[0]));
        }

        seguradora = seguradoraRepository.save(seguradora);
        return seguroMapper.toSeguradoraResponse(seguradora);
    }

    @Transactional(readOnly = true)
    public SeguradoraResponse findById(UUID id) {
        return seguroMapper.toSeguradoraResponse(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public List<SeguradoraResponse> findAll() {
        return seguradoraRepository.findByActiveTrue().stream()
            .map(seguroMapper::toSeguradoraResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<SeguradoraResponse> search(String nome) {
        return seguradoraRepository.findByNomeContainingIgnoreCaseAndActiveTrue(nome).stream()
            .map(seguroMapper::toSeguradoraResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public SeguradoraStatsResponse getStats(UUID id) {
        Seguradora seguradora = findEntityById(id);
        List<Apolice> apolices = apoliceRepository.findBySeguradoraIdAndActiveTrue(id);

        long totalApolices = apolices.size();
        long vigentes = apolices.stream().filter(a -> a.getStatus() == StatusApolice.VIGENTE).count();
        long vencidas = apolices.stream().filter(a -> a.getStatus() == StatusApolice.VENCIDA).count();

        BigDecimal premioMedio = BigDecimal.ZERO;
        BigDecimal isMedio = BigDecimal.ZERO;
        long totalCoberturas = 0;

        if (totalApolices > 0) {
            BigDecimal totalPremios = apolices.stream()
                .map(Apolice::getPremioTotal)
                .filter(p -> p != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            premioMedio = totalPremios.divide(BigDecimal.valueOf(totalApolices), 2, RoundingMode.HALF_UP);

            BigDecimal totalIS = apolices.stream()
                .map(Apolice::getImportanciaSeguradaTotal)
                .filter(i -> i != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            isMedio = totalIS.divide(BigDecimal.valueOf(totalApolices), 2, RoundingMode.HALF_UP);

            totalCoberturas = apolices.stream()
                .mapToLong(a -> a.getCoberturas().size())
                .sum();
        }

        long totalCondominios = apolices.stream()
            .map(a -> a.getCondominio().getId())
            .distinct()
            .count();

        // Sinistro stats from apolices' condominios would need SinistroRepository
        // For simplicity, return 0 for sinistro stats - they're computed from a different angle
        return new SeguradoraStatsResponse(
            id,
            seguradora.getNome(),
            totalApolices,
            vigentes,
            vencidas,
            premioMedio,
            isMedio,
            totalCoberturas,
            0L,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            totalCondominios
        );
    }

    @Transactional
    public void delete(UUID id) {
        Seguradora seguradora = findEntityById(id);
        seguradora.setActive(false);
        seguradoraRepository.save(seguradora);
    }

    public Seguradora findEntityById(UUID id) {
        return seguradoraRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Seguradora não encontrada"));
    }
}
