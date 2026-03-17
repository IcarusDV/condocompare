package com.condocompare.dashboard.service;

import com.condocompare.condominios.entity.Condominio;
import com.condocompare.condominios.repository.CondominioRepository;
import com.condocompare.dashboard.dto.ApoliceVencendoDTO;
import com.condocompare.dashboard.dto.DashboardChartsDTO;
import com.condocompare.dashboard.dto.DashboardMetricsDTO;
import com.condocompare.documentos.entity.Documento;
import com.condocompare.documentos.entity.TipoDocumento;
import com.condocompare.documentos.repository.DocumentoRepository;
import com.condocompare.notificacoes.repository.NotificacaoRepository;
import com.condocompare.sinistros.entity.StatusSinistro;
import com.condocompare.sinistros.repository.SinistroRepository;
import com.condocompare.users.entity.User;
import com.condocompare.users.repository.UserRepository;
import com.condocompare.vistorias.entity.StatusVistoria;
import com.condocompare.vistorias.repository.VistoriaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.cache.annotation.Cacheable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final CondominioRepository condominioRepository;
    private final DocumentoRepository documentoRepository;
    private final VistoriaRepository vistoriaRepository;
    private final SinistroRepository sinistroRepository;
    private final NotificacaoRepository notificacaoRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardMetricsDTO getMetrics() {
        User currentUser = getCurrentUser();
        LocalDate hoje = LocalDate.now();
        LocalDate limite30dias = hoje.plusDays(30);

        // Counts
        long totalCondominios = condominioRepository.countByActiveTrue();
        long totalDocumentos = documentoRepository.countActive();
        long totalVistorias = vistoriaRepository.countActive();
        long totalSinistros = sinistroRepository.countActive();
        long totalApolices = documentoRepository.countByTipo(TipoDocumento.APOLICE);
        long totalOrcamentos = documentoRepository.countByTipo(TipoDocumento.ORCAMENTO);

        // Policies expiring - single query with JOIN (no N+1)
        long apolicesVencendo30dias = documentoRepository.countApolicesVencendo30Dias();

        List<ApoliceVencendoDTO> proximasVencer = documentoRepository.findApolicesVencendo30Dias()
            .stream()
            .map(row -> new ApoliceVencendoDTO(
                (UUID) row[0],                          // id
                (String) row[1],                        // nome
                (String) row[5],                        // condominioNome (from JOIN)
                (String) row[3],                        // seguradoraNome
                ((java.sql.Date) row[2]).toLocalDate(), // dataVigenciaFim
                ChronoUnit.DAYS.between(hoje, ((java.sql.Date) row[2]).toLocalDate())
            ))
            .toList();

        // Vistorias
        long vistoriasAgendadas = vistoriaRepository.countByStatus(StatusVistoria.AGENDADA);
        long vistoriasConcluidas = vistoriaRepository.countByStatus(StatusVistoria.CONCLUIDA);

        // Sinistros
        long sinistrosAbertos = sinistroRepository.countByStatus(StatusSinistro.ABERTO);
        long sinistrosEmAnalise = sinistroRepository.countByStatus(StatusSinistro.EM_ANALISE);
        BigDecimal valorTotalPrejuizos = sinistroRepository.sumValorPrejuizo();
        BigDecimal valorTotalIndenizado = sinistroRepository.sumValorIndenizado();

        // Notifications
        long notificacoesNaoLidas = notificacaoRepository.countByUserIdAndLidaFalseAndActiveTrue(currentUser.getId());

        return new DashboardMetricsDTO(
            totalCondominios,
            totalDocumentos,
            totalVistorias,
            totalSinistros,
            totalApolices,
            totalOrcamentos,
            apolicesVencendo30dias,
            proximasVencer,
            vistoriasAgendadas,
            vistoriasConcluidas,
            sinistrosAbertos,
            sinistrosEmAnalise,
            valorTotalPrejuizos != null ? valorTotalPrejuizos : BigDecimal.ZERO,
            valorTotalIndenizado != null ? valorTotalIndenizado : BigDecimal.ZERO,
            notificacoesNaoLidas
        );
    }

    @Cacheable(value = "dashboard-charts", key = "#root.methodName")
    @Transactional(readOnly = true)
    public DashboardChartsDTO getChartData() {
        // Sinistros by status
        List<DashboardChartsDTO.StatusCount> sinistrosByStatus = sinistroRepository.countGroupByStatus()
            .stream()
            .map(row -> new DashboardChartsDTO.StatusCount(row[0].toString(), ((Number) row[1]).longValue()))
            .collect(Collectors.toList());

        // Documentos by tipo
        List<DashboardChartsDTO.TipoCount> documentosByTipo = documentoRepository.countGroupByTipo()
            .stream()
            .map(row -> new DashboardChartsDTO.TipoCount(row[0].toString(), ((Number) row[1]).longValue()))
            .collect(Collectors.toList());

        // Vistorias by month (last 12 months)
        List<DashboardChartsDTO.MonthCount> vistoriasByMonth = vistoriaRepository.countGroupByMonth()
            .stream()
            .map(row -> new DashboardChartsDTO.MonthCount((String) row[0], ((Number) row[1]).longValue()))
            .collect(Collectors.toList());

        // Top seguradoras by condominio count
        List<Object[]> seguradoraData = condominioRepository.countBySeguradora();
        List<DashboardChartsDTO.SeguradoraCount> topSeguradoras = seguradoraData.stream()
            .map(row -> new DashboardChartsDTO.SeguradoraCount((String) row[0], ((Number) row[1]).longValue()))
            .collect(Collectors.toList());

        // Recent activity (last 10 events across modules)
        final List<DashboardChartsDTO.ActivityEventDTO> recentActivity = new ArrayList<>();

        // Recent sinistros
        sinistroRepository.findRecentActive(5).forEach(s -> recentActivity.add(
            new DashboardChartsDTO.ActivityEventDTO(
                s.getId(), "sinistro",
                "Sinistro " + (s.getNumeroSinistro() != null ? s.getNumeroSinistro() : s.getTipo().name()),
                s.getDescricao() != null ? s.getDescricao().substring(0, Math.min(s.getDescricao().length(), 80)) : "",
                s.getCreatedAt()
            )
        ));

        // Recent vistorias
        vistoriaRepository.findRecentActive(5).forEach(v -> recentActivity.add(
            new DashboardChartsDTO.ActivityEventDTO(
                v.getId(), "vistoria",
                "Vistoria " + v.getTipo().name(),
                v.getObservacoes() != null ? v.getObservacoes().substring(0, Math.min(v.getObservacoes().length(), 80)) : "Vistoria agendada",
                v.getCreatedAt()
            )
        ));

        // Recent documents
        documentoRepository.findRecentActive(5).forEach(d -> recentActivity.add(
            new DashboardChartsDTO.ActivityEventDTO(
                d.getId(), "documento",
                d.getNome() != null ? d.getNome() : "Documento",
                d.getTipo().name(),
                d.getCreatedAt()
            )
        ));

        // Sort by timestamp desc and limit to 10
        recentActivity.sort(Comparator.comparing(DashboardChartsDTO.ActivityEventDTO::timestamp).reversed());
        List<DashboardChartsDTO.ActivityEventDTO> limitedActivity = recentActivity.size() > 10
            ? recentActivity.subList(0, 10)
            : recentActivity;

        return new DashboardChartsDTO(
            sinistrosByStatus,
            documentosByTipo,
            vistoriasByMonth,
            topSeguradoras,
            limitedActivity
        );
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }
}
