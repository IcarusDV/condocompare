package com.condocompare.seguros.service;

import com.condocompare.common.exception.ResourceNotFoundException;
import com.condocompare.condominios.entity.Condominio;
import com.condocompare.condominios.repository.CondominioRepository;
import com.condocompare.condominios.service.CondominioService;
import com.condocompare.seguros.dto.*;
import com.condocompare.seguros.entity.*;
import com.condocompare.seguros.mapper.SeguroMapper;
import com.condocompare.seguros.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApoliceService {

    private final ApoliceRepository apoliceRepository;
    private final CoberturaRepository coberturaRepository;
    private final CondominioRepository condominioRepository;
    private final SeguradoraService seguradoraService;
    private final SeguroMapper seguroMapper;
    private final CondominioService condominioService;

    @Transactional
    public ApoliceResponse create(CreateApoliceRequest request) {
        Condominio condominio = condominioRepository.findById(request.condominioId())
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        Seguradora seguradora = seguradoraService.findEntityById(request.seguradoraId());

        Apolice apolice = Apolice.builder()
            .numeroApolice(request.numeroApolice())
            .condominio(condominio)
            .seguradora(seguradora)
            .status(request.status() != null ? request.status() : StatusApolice.VIGENTE)
            .dataInicio(request.dataInicio())
            .dataFim(request.dataFim())
            .premioTotal(request.premioTotal())
            .premioLiquido(request.premioLiquido())
            .iof(request.iof())
            .formaPagamento(request.formaPagamento())
            .numeroParcelas(request.numeroParcelas())
            .valorParcela(request.valorParcela())
            .importanciaSeguradaTotal(request.importanciaSeguradaTotal())
            .documentoId(request.documentoId())
            .propostaId(request.propostaId())
            .corretorNome(request.corretorNome())
            .corretorSusep(request.corretorSusep())
            .corretorTelefone(request.corretorTelefone())
            .corretorEmail(request.corretorEmail())
            .observacoes(request.observacoes())
            .clausulasEspeciais(request.clausulasEspeciais())
            .build();

        apolice = apoliceRepository.save(apolice);

        if (request.coberturas() != null && !request.coberturas().isEmpty()) {
            for (CreateCoberturaRequest coberturaRequest : request.coberturas()) {
                Cobertura cobertura = seguroMapper.toCobertura(coberturaRequest);
                apolice.addCobertura(cobertura);
            }
            apolice = apoliceRepository.save(apolice);
        }

        return seguroMapper.toApoliceResponse(apolice);
    }

    @Transactional
    public ApoliceResponse update(UUID id, UpdateApoliceRequest request) {
        Apolice apolice = findEntityById(id);

        if (StringUtils.hasText(request.numeroApolice())) {
            apolice.setNumeroApolice(request.numeroApolice());
        }
        if (request.seguradoraId() != null) {
            apolice.setSeguradora(seguradoraService.findEntityById(request.seguradoraId()));
        }
        if (request.status() != null) {
            apolice.setStatus(request.status());
        }
        if (request.dataInicio() != null) {
            apolice.setDataInicio(request.dataInicio());
        }
        if (request.dataFim() != null) {
            apolice.setDataFim(request.dataFim());
        }
        if (request.premioTotal() != null) {
            apolice.setPremioTotal(request.premioTotal());
        }
        if (request.premioLiquido() != null) {
            apolice.setPremioLiquido(request.premioLiquido());
        }
        if (request.iof() != null) {
            apolice.setIof(request.iof());
        }
        if (request.formaPagamento() != null) {
            apolice.setFormaPagamento(request.formaPagamento());
        }
        if (request.numeroParcelas() != null) {
            apolice.setNumeroParcelas(request.numeroParcelas());
        }
        if (request.valorParcela() != null) {
            apolice.setValorParcela(request.valorParcela());
        }
        if (request.importanciaSeguradaTotal() != null) {
            apolice.setImportanciaSeguradaTotal(request.importanciaSeguradaTotal());
        }
        if (request.documentoId() != null) {
            apolice.setDocumentoId(request.documentoId());
        }
        if (request.propostaId() != null) {
            apolice.setPropostaId(request.propostaId());
        }
        if (request.corretorNome() != null) {
            apolice.setCorretorNome(request.corretorNome());
        }
        if (request.corretorSusep() != null) {
            apolice.setCorretorSusep(request.corretorSusep());
        }
        if (request.corretorTelefone() != null) {
            apolice.setCorretorTelefone(request.corretorTelefone());
        }
        if (request.corretorEmail() != null) {
            apolice.setCorretorEmail(request.corretorEmail());
        }
        if (request.observacoes() != null) {
            apolice.setObservacoes(request.observacoes());
        }
        if (request.clausulasEspeciais() != null) {
            apolice.setClausulasEspeciais(request.clausulasEspeciais());
        }

        apolice = apoliceRepository.save(apolice);
        return seguroMapper.toApoliceResponse(apolice);
    }

    @Transactional(readOnly = true)
    public ApoliceResponse findById(UUID id) {
        Apolice apolice = findEntityById(id);
        condominioService.validateCondominioAccess(apolice.getCondominio().getId());
        return seguroMapper.toApoliceResponse(apolice);
    }

    @Transactional(readOnly = true)
    public Page<ApoliceListResponse> findAll(ApoliceFilter filter, Pageable pageable) {
        return apoliceRepository
            .findAll(ApoliceSpecification.withFilter(filter), pageable)
            .map(seguroMapper::toApoliceListResponse);
    }

    @Transactional(readOnly = true)
    public List<ApoliceListResponse> findByCondominio(UUID condominioId) {
        condominioService.validateCondominioAccess(condominioId);
        return apoliceRepository.findByCondominioIdAndActiveTrue(condominioId).stream()
            .map(seguroMapper::toApoliceListResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public ApoliceResponse findVigenteByCondominio(UUID condominioId) {
        condominioService.validateCondominioAccess(condominioId);
        return apoliceRepository.findApoliceVigenteByCondominio(condominioId)
            .map(seguroMapper::toApoliceResponse)
            .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ApoliceListResponse> findVencendo(int dias) {
        LocalDate dataLimite = LocalDate.now().plusDays(dias);
        return apoliceRepository.findVencendo(dataLimite).stream()
            .map(seguroMapper::toApoliceListResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ApoliceListResponse> findVencidas() {
        return apoliceRepository.findVencidas(LocalDate.now()).stream()
            .map(seguroMapper::toApoliceListResponse)
            .toList();
    }

    @Transactional
    public CoberturaResponse addCobertura(UUID apoliceId, CreateCoberturaRequest request) {
        Apolice apolice = findEntityById(apoliceId);
        Cobertura cobertura = seguroMapper.toCobertura(request);
        apolice.addCobertura(cobertura);
        apoliceRepository.save(apolice);
        return seguroMapper.toCoberturaResponse(cobertura);
    }

    @Transactional
    public void removeCobertura(UUID apoliceId, UUID coberturaId) {
        Apolice apolice = findEntityById(apoliceId);
        apolice.getCoberturas().removeIf(c -> c.getId().equals(coberturaId));
        apoliceRepository.save(apolice);
    }

    @Transactional(readOnly = true)
    public List<CoberturaResponse> findCoberturasByApolice(UUID apoliceId) {
        return coberturaRepository.findByApoliceId(apoliceId).stream()
            .map(seguroMapper::toCoberturaResponse)
            .toList();
    }

    @Transactional
    public void delete(UUID id) {
        Apolice apolice = findEntityById(id);
        apolice.setActive(false);
        apoliceRepository.save(apolice);
    }

    @Transactional
    public ApoliceResponse renovar(UUID id) {
        Apolice apoliceAntiga = findEntityById(id);
        apoliceAntiga.setStatus(StatusApolice.VENCIDA);
        apoliceRepository.save(apoliceAntiga);

        Apolice novaApolice = Apolice.builder()
            .condominio(apoliceAntiga.getCondominio())
            .seguradora(apoliceAntiga.getSeguradora())
            .status(StatusApolice.EM_RENOVACAO)
            .dataInicio(apoliceAntiga.getDataFim().plusDays(1))
            .dataFim(apoliceAntiga.getDataFim().plusYears(1))
            .corretorNome(apoliceAntiga.getCorretorNome())
            .corretorSusep(apoliceAntiga.getCorretorSusep())
            .corretorTelefone(apoliceAntiga.getCorretorTelefone())
            .corretorEmail(apoliceAntiga.getCorretorEmail())
            .build();

        novaApolice = apoliceRepository.save(novaApolice);

        for (Cobertura coberturaAntiga : apoliceAntiga.getCoberturas()) {
            Cobertura novaCobertura = Cobertura.builder()
                .tipo(coberturaAntiga.getTipo())
                .descricao(coberturaAntiga.getDescricao())
                .limiteMaximo(coberturaAntiga.getLimiteMaximo())
                .franquia(coberturaAntiga.getFranquia())
                .franquiaPercentual(coberturaAntiga.getFranquiaPercentual())
                .carenciaDias(coberturaAntiga.getCarenciaDias())
                .condicoesEspeciais(coberturaAntiga.getCondicoesEspeciais())
                .exclusoes(coberturaAntiga.getExclusoes())
                .contratada(coberturaAntiga.isContratada())
                .obrigatoria(coberturaAntiga.isObrigatoria())
                .recomendada(coberturaAntiga.isRecomendada())
                .build();
            novaApolice.addCobertura(novaCobertura);
        }

        novaApolice = apoliceRepository.save(novaApolice);
        return seguroMapper.toApoliceResponse(novaApolice);
    }

    @Transactional(readOnly = true)
    public long countVigentes() {
        return apoliceRepository.countVigentes();
    }

    @Transactional(readOnly = true)
    public long countVencendoEmDias(int dias) {
        return apoliceRepository.countVencendoEmDias(LocalDate.now(), LocalDate.now().plusDays(dias));
    }

    private Apolice findEntityById(UUID id) {
        return apoliceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Apólice não encontrada"));
    }
}
