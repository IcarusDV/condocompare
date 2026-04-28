package com.condocompare.sinistros.service;

import com.condocompare.common.exception.BusinessException;
import com.condocompare.common.exception.ResourceNotFoundException;
import com.condocompare.condominios.entity.Condominio;
import com.condocompare.condominios.repository.CondominioRepository;
import com.condocompare.sinistros.dto.*;
import com.condocompare.sinistros.entity.HistoricoEvento;
import com.condocompare.sinistros.entity.Sinistro;
import com.condocompare.sinistros.entity.StatusSinistro;
import com.condocompare.sinistros.entity.TipoSinistro;
import com.condocompare.sinistros.repository.SinistroRepository;
import com.condocompare.users.entity.User;
import com.condocompare.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SinistroService {

    private final SinistroRepository sinistroRepository;
    private final CondominioRepository condominioRepository;
    private final UserRepository userRepository;

    @Transactional
    public SinistroResponse create(CreateSinistroRequest request) {
        User currentUser = getCurrentUser();

        // Validate condominio exists
        Condominio condominio = condominioRepository.findById(request.condominioId())
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        Sinistro sinistro = Sinistro.builder()
            .condominioId(request.condominioId())
            .apoliceId(request.apoliceId())
            .tipo(request.tipo())
            .status(StatusSinistro.ABERTO)
            .dataOcorrencia(request.dataOcorrencia())
            .dataComunicacao(LocalDateTime.now())
            .descricao(request.descricao())
            .localOcorrencia(request.localOcorrencia())
            .valorPrejuizo(request.valorPrejuizo())
            .coberturaAcionada(request.coberturaAcionada())
            .observacoes(request.observacoes())
            .historico(new ArrayList<>())
            .build();

        // Add initial event to history
        sinistro.getHistorico().add(new HistoricoEvento(
            LocalDateTime.now().toString(),
            "Sinistro aberto",
            currentUser.getName()
        ));

        sinistro.setCreatedBy(currentUser.getId().toString());
        sinistro.setActive(true);

        Sinistro saved = sinistroRepository.save(sinistro);
        log.info("Sinistro created: id={}, condominio={}, tipo={}, user={}",
            saved.getId(), request.condominioId(), request.tipo(), currentUser.getEmail());

        return toResponse(saved, condominio.getNome());
    }

    @Transactional
    public SinistroResponse update(UUID id, UpdateSinistroRequest request) {
        User currentUser = getCurrentUser();

        Sinistro sinistro = sinistroRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sinistro não encontrado"));

        if (!sinistro.isActive()) {
            throw new BusinessException("Sinistro não está ativo");
        }

        Condominio condominio = condominioRepository.findById(sinistro.getCondominioId())
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        // Track status change for history
        StatusSinistro oldStatus = sinistro.getStatus();

        if (request.apoliceId() != null) sinistro.setApoliceId(request.apoliceId());
        if (request.numeroSinistro() != null) sinistro.setNumeroSinistro(request.numeroSinistro());
        if (request.tipo() != null) sinistro.setTipo(request.tipo());
        if (request.status() != null) sinistro.setStatus(request.status());
        if (request.dataOcorrencia() != null) sinistro.setDataOcorrencia(request.dataOcorrencia());
        if (request.dataComunicacao() != null) sinistro.setDataComunicacao(request.dataComunicacao());
        if (request.descricao() != null) sinistro.setDescricao(request.descricao());
        if (request.localOcorrencia() != null) sinistro.setLocalOcorrencia(request.localOcorrencia());
        if (request.valorPrejuizo() != null) sinistro.setValorPrejuizo(request.valorPrejuizo());
        if (request.valorIndenizado() != null) sinistro.setValorIndenizado(request.valorIndenizado());
        if (request.coberturaAcionada() != null) sinistro.setCoberturaAcionada(request.coberturaAcionada());
        if (request.documentosIds() != null) sinistro.setDocumentosIds(request.documentosIds());
        if (request.fotosUrls() != null) sinistro.setFotosUrls(request.fotosUrls());
        if (request.seguradoraProtocolo() != null) sinistro.setSeguradoraProtocolo(request.seguradoraProtocolo());
        if (request.seguradoraContato() != null) sinistro.setSeguradoraContato(request.seguradoraContato());
        if (request.valorFranquia() != null) sinistro.setValorFranquia(request.valorFranquia());
        if (request.observacoes() != null) sinistro.setObservacoes(request.observacoes());

        // Add status change to history
        if (request.status() != null && request.status() != oldStatus) {
            if (sinistro.getHistorico() == null) {
                sinistro.setHistorico(new ArrayList<>());
            }
            sinistro.getHistorico().add(new HistoricoEvento(
                LocalDateTime.now().toString(),
                "Status alterado de " + oldStatus + " para " + request.status(),
                currentUser.getName()
            ));
        }

        sinistro.setUpdatedBy(currentUser.getId().toString());

        Sinistro saved = sinistroRepository.save(sinistro);
        log.info("Sinistro updated: id={}, user={}", id, currentUser.getEmail());

        return toResponse(saved, condominio.getNome());
    }

    @Transactional
    public SinistroResponse addHistorico(UUID id, AddHistoricoRequest request) {
        User currentUser = getCurrentUser();

        Sinistro sinistro = sinistroRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sinistro não encontrado"));

        if (!sinistro.isActive()) {
            throw new BusinessException("Sinistro não está ativo");
        }

        Condominio condominio = condominioRepository.findById(sinistro.getCondominioId())
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        if (sinistro.getHistorico() == null) {
            sinistro.setHistorico(new ArrayList<>());
        }

        sinistro.getHistorico().add(new HistoricoEvento(
            LocalDateTime.now().toString(),
            request.descricao(),
            currentUser.getName()
        ));

        sinistro.setUpdatedBy(currentUser.getId().toString());

        Sinistro saved = sinistroRepository.save(sinistro);
        log.info("Historico added to sinistro: id={}, user={}", id, currentUser.getEmail());

        return toResponse(saved, condominio.getNome());
    }

    @Transactional(readOnly = true)
    public SinistroResponse findById(UUID id) {
        User currentUser = getCurrentUser();

        Sinistro sinistro = sinistroRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sinistro não encontrado"));

        if (!sinistro.isActive()) {
            throw new ResourceNotFoundException("Sinistro não encontrado");
        }

        checkCondominioAccess(currentUser, sinistro.getCondominioId());

        Condominio condominio = condominioRepository.findById(sinistro.getCondominioId())
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        return toResponse(sinistro, condominio.getNome());
    }

    @Transactional(readOnly = true)
    public Page<SinistroListResponse> findAll(UUID condominioId, TipoSinistro tipo, StatusSinistro status, Pageable pageable) {
        User currentUser = getCurrentUser();
        String tipoStr = tipo != null ? tipo.name() : null;
        String statusStr = status != null ? status.name() : null;

        List<UUID> allowedIds = getAllowedCondominioIds(currentUser);
        Page<Sinistro> sinistros;
        if (allowedIds != null) {
            if (allowedIds.isEmpty()) {
                return Page.empty(pageable);
            }
            sinistros = sinistroRepository.findAllWithFiltersRestricted(allowedIds, condominioId, tipoStr, statusStr, pageable);
        } else {
            sinistros = sinistroRepository.findAllWithFilters(condominioId, tipoStr, statusStr, pageable);
        }

        // Batch-fetch condominio names to avoid N+1
        List<UUID> condominioIds = sinistros.getContent().stream()
            .map(Sinistro::getCondominioId)
            .distinct()
            .toList();

        Map<UUID, String> condominioNames = Map.of();
        if (!condominioIds.isEmpty()) {
            condominioNames = sinistroRepository.findCondominioNamesByIds(condominioIds)
                .stream()
                .collect(Collectors.toMap(
                    row -> (UUID) row[0],
                    row -> (String) row[1]
                ));
        }

        final Map<UUID, String> names = condominioNames;
        return sinistros.map(s -> toListResponse(s, names.getOrDefault(s.getCondominioId(), "N/A")));
    }

    @Transactional(readOnly = true)
    public List<SinistroListResponse> findByCondominio(UUID condominioId) {
        Condominio condominio = condominioRepository.findById(condominioId)
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        return sinistroRepository.findByCondominioIdAndActiveTrue(condominioId)
            .stream()
            .map(s -> toListResponse(s, condominio.getNome()))
            .toList();
    }

    @Transactional
    public void delete(UUID id) {
        User currentUser = getCurrentUser();

        Sinistro sinistro = sinistroRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sinistro não encontrado"));

        sinistro.setActive(false);
        sinistro.setUpdatedBy(currentUser.getId().toString());
        sinistroRepository.save(sinistro);

        log.info("Sinistro deleted: id={}, user={}", id, currentUser.getEmail());
    }

    private List<UUID> getAllowedCondominioIds(User user) {
        return switch (user.getRole()) {
            case ADMINISTRADORA -> condominioRepository.findIdsByAdministradoraId(user.getOrganizationId());
            case SINDICO -> condominioRepository.findIdsBySindicoId(user.getId());
            case ADMIN, CORRETORA -> null;
        };
    }

    private void checkCondominioAccess(User user, UUID condominioId) {
        List<UUID> allowed = getAllowedCondominioIds(user);
        if (allowed != null && !allowed.contains(condominioId)) {
            throw new BusinessException("Sem permissão para acessar este sinistro");
        }
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
    }

    @Transactional(readOnly = true)
    public SinistroStatsResponse getStats() {
        long total = sinistroRepository.countActive();
        long abertos = sinistroRepository.countByStatus(StatusSinistro.ABERTO);
        long emAnalise = sinistroRepository.countByStatus(StatusSinistro.EM_ANALISE);
        long aprovados = sinistroRepository.countByStatus(StatusSinistro.APROVADO);
        long negados = sinistroRepository.countByStatus(StatusSinistro.NEGADO);
        long pagos = sinistroRepository.countByStatus(StatusSinistro.PAGO);
        long cancelados = sinistroRepository.countByStatus(StatusSinistro.CANCELADO);

        java.math.BigDecimal totalPrejuizo = sinistroRepository.sumValorPrejuizo();
        java.math.BigDecimal totalIndenizado = sinistroRepository.sumValorIndenizado();

        Double avgDias = sinistroRepository.avgResolucaoDias();
        double tempoMedio = avgDias != null ? Math.round(avgDias * 10.0) / 10.0 : 0;

        long resolvidos = aprovados + pagos + negados;
        double taxaAprovacao = resolvidos > 0 ? Math.round(((double)(aprovados + pagos) / resolvidos) * 1000.0) / 10.0 : 0;
        double taxaNegacao = resolvidos > 0 ? Math.round(((double)negados / resolvidos) * 1000.0) / 10.0 : 0;

        List<Map<String, Object>> sinistrosPorMes = sinistroRepository.countByMonth().stream()
            .map(row -> {
                Map<String, Object> m = new HashMap<>();
                m.put("mes", row[0]);
                m.put("total", ((Number) row[1]).longValue());
                return m;
            })
            .toList();

        Map<String, Long> porStatus = new HashMap<>();
        porStatus.put("ABERTO", abertos);
        porStatus.put("EM_ANALISE", emAnalise);
        porStatus.put("APROVADO", aprovados);
        porStatus.put("NEGADO", negados);
        porStatus.put("PAGO", pagos);
        porStatus.put("CANCELADO", cancelados);

        return new SinistroStatsResponse(
            total, abertos, emAnalise, aprovados, negados, pagos, cancelados,
            totalPrejuizo, totalIndenizado,
            tempoMedio, taxaAprovacao, taxaNegacao,
            sinistrosPorMes, porStatus
        );
    }

    private SinistroResponse toResponse(Sinistro s, String condominioNome) {
        return new SinistroResponse(
            s.getId(),
            s.getCondominioId(),
            condominioNome,
            s.getApoliceId(),
            s.getNumeroSinistro(),
            s.getTipo(),
            s.getStatus(),
            s.getDataOcorrencia(),
            s.getDataComunicacao(),
            s.getDescricao(),
            s.getLocalOcorrencia(),
            s.getValorPrejuizo(),
            s.getValorFranquia(),
            s.getValorIndenizado(),
            s.getCoberturaAcionada(),
            s.getDocumentosIds(),
            s.getFotosUrls(),
            s.getHistorico(),
            s.getSeguradoraProtocolo(),
            s.getSeguradoraContato(),
            s.getObservacoes(),
            s.getCreatedAt(),
            s.getUpdatedAt()
        );
    }

    private SinistroListResponse toListResponse(Sinistro s, String condominioNome) {
        return new SinistroListResponse(
            s.getId(),
            s.getCondominioId(),
            condominioNome,
            s.getNumeroSinistro(),
            s.getTipo(),
            s.getStatus(),
            s.getDataOcorrencia(),
            s.getDescricao() != null && s.getDescricao().length() > 100
                ? s.getDescricao().substring(0, 100) + "..."
                : s.getDescricao(),
            s.getValorPrejuizo(),
            s.getValorIndenizado(),
            s.getCreatedAt()
        );
    }
}
