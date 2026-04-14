package com.condocompare.seguros.service;

import com.condocompare.common.exception.BusinessException;
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
        validateDatas(request.dataInicio(), request.dataFim());

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

        LocalDate novoInicio = request.dataInicio() != null ? request.dataInicio() : apolice.getDataInicio();
        LocalDate novoFim = request.dataFim() != null ? request.dataFim() : apolice.getDataFim();
        validateDatas(novoInicio, novoFim);

        if (StringUtils.hasText(request.numeroApolice())) {
            apolice.setNumeroApolice(request.numeroApolice());
        }
        if (request.condominioId() != null) {
            Condominio novoCondominio = condominioRepository.findById(request.condominioId())
                .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));
            condominioService.validateCondominioAccess(novoCondominio.getId());
            apolice.setCondominio(novoCondominio);
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
        return coberturaRepository.findByApoliceIdAndActiveTrue(apoliceId).stream()
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

        // Gera novo número de apólice baseado no antigo
        String novoNumero = gerarNovoNumeroRenovacao(apoliceAntiga.getNumeroApolice());

        Apolice novaApolice = Apolice.builder()
            .numeroApolice(novoNumero)
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

    /**
     * Gera novo número de apólice na renovação.
     * Estratégias:
     * 1. Se o número antigo terminar em "-RNN" (ex: ABC123-R02), incrementa a renovação
     * 2. Se terminar em /YYYY, incrementa o ano
     * 3. Caso contrário, adiciona "-R02" ao número antigo
     */
    private String gerarNovoNumeroRenovacao(String numeroAntigo) {
        if (numeroAntigo == null || numeroAntigo.isBlank()) {
            return "REN-" + System.currentTimeMillis();
        }

        // Padrão "-R02", "-R03", etc.
        java.util.regex.Pattern renPattern = java.util.regex.Pattern.compile("^(.*)-R(\\d+)$");
        java.util.regex.Matcher matcher = renPattern.matcher(numeroAntigo);
        if (matcher.matches()) {
            String base = matcher.group(1);
            int versao = Integer.parseInt(matcher.group(2)) + 1;
            return String.format("%s-R%02d", base, versao);
        }

        // Caso contrário, adiciona -R02 (segunda versão da apólice)
        return numeroAntigo + "-R02";
    }

    private Apolice findEntityById(UUID id) {
        return apoliceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Apólice não encontrada"));
    }

    private void validateDatas(LocalDate dataInicio, LocalDate dataFim) {
        if (dataInicio != null && dataFim != null && !dataFim.isAfter(dataInicio)) {
            throw new BusinessException("Data fim deve ser posterior à data início");
        }
    }
}
