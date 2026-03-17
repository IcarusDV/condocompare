package com.condocompare.notificacoes.service;

import com.condocompare.condominios.entity.Condominio;
import com.condocompare.condominios.repository.CondominioRepository;
import com.condocompare.documentos.entity.Documento;
import com.condocompare.documentos.entity.TipoDocumento;
import com.condocompare.documentos.repository.DocumentoRepository;
import com.condocompare.notificacoes.entity.TipoNotificacao;
import com.condocompare.sinistros.entity.Sinistro;
import com.condocompare.sinistros.entity.StatusSinistro;
import com.condocompare.sinistros.repository.SinistroRepository;
import com.condocompare.users.entity.Role;
import com.condocompare.users.entity.User;
import com.condocompare.users.repository.UserRepository;
import com.condocompare.vistorias.entity.StatusVistoria;
import com.condocompare.vistorias.entity.Vistoria;
import com.condocompare.vistorias.repository.VistoriaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VencimentoApoliceScheduler {

    private final DocumentoRepository documentoRepository;
    private final CondominioRepository condominioRepository;
    private final VistoriaRepository vistoriaRepository;
    private final SinistroRepository sinistroRepository;
    private final UserRepository userRepository;
    private final NotificacaoService notificacaoService;

    // Executa todos os dias as 8h
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void executarVerificacaoDiaria() {
        log.info("Iniciando verificacoes diarias de alertas...");

        int totalNotificacoes = 0;
        totalNotificacoes += verificarVencimentosApolices();
        totalNotificacoes += verificarVistoriasProximas();
        totalNotificacoes += verificarSinistrosAtualizados();

        log.info("Verificacoes diarias concluidas. {} notificacoes criadas.", totalNotificacoes);
    }

    // ===== Vencimento de Apolices =====

    private int verificarVencimentosApolices() {
        log.info("Verificando vencimentos de apolices...");

        LocalDate hoje = LocalDate.now();
        List<Documento> apolices = documentoRepository.findByTipoAndActiveTrue(TipoDocumento.APOLICE);
        int notificacoesEnviadas = 0;

        for (Documento apolice : apolices) {
            if (apolice.getDataVigenciaFim() == null) continue;

            LocalDate dataVencimento = apolice.getDataVigenciaFim();
            long diasParaVencer = ChronoUnit.DAYS.between(hoje, dataVencimento);

            // Skip if already notified
            if (notificacaoService.notificacaoJaEnviada(TipoNotificacao.VENCIMENTO_APOLICE, apolice.getId())) {
                continue;
            }

            String titulo = null;
            String mensagem = null;

            if (diasParaVencer <= 0) {
                titulo = "Apolice Vencida!";
                mensagem = String.format("A apolice '%s' venceu em %s. Renovacao urgente necessaria.",
                    apolice.getNome(), dataVencimento);
            } else if (diasParaVencer <= 7) {
                titulo = "Apolice vence em " + diasParaVencer + " dias!";
                mensagem = String.format("A apolice '%s' vencera em %s. Agende a renovacao.",
                    apolice.getNome(), dataVencimento);
            } else if (diasParaVencer <= 15) {
                titulo = "Apolice vence em " + diasParaVencer + " dias";
                mensagem = String.format("A apolice '%s' vencera em %s. Considere iniciar processo de renovacao.",
                    apolice.getNome(), dataVencimento);
            } else if (diasParaVencer <= 30) {
                titulo = "Apolice vence em " + diasParaVencer + " dias";
                mensagem = String.format("A apolice '%s' vencera em %s.",
                    apolice.getNome(), dataVencimento);
            }

            if (titulo != null) {
                String condominioNome = condominioRepository.findById(apolice.getCondominioId())
                    .map(Condominio::getNome).orElse("N/A");
                mensagem = "[" + condominioNome + "] " + mensagem;

                notificacoesEnviadas += notificarUsuariosRelevantes(
                    TipoNotificacao.VENCIMENTO_APOLICE, titulo, mensagem, "APOLICE", apolice.getId());

                apolice.setNotificacaoVencimentoEnviada(true);
                documentoRepository.save(apolice);
            }
        }

        log.info("Vencimentos: {} notificacoes enviadas.", notificacoesEnviadas);
        return notificacoesEnviadas;
    }

    // ===== Vistorias Proximas =====

    private int verificarVistoriasProximas() {
        log.info("Verificando vistorias proximas...");

        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime amanha = agora.plusDays(1).withHour(23).withMinute(59);
        int notificacoesEnviadas = 0;

        // Find vistorias scheduled for today or tomorrow
        List<Vistoria> todasVistorias = vistoriaRepository.findAll();

        for (Vistoria vistoria : todasVistorias) {
            if (!vistoria.isActive()) continue;
            if (vistoria.getStatus() != StatusVistoria.AGENDADA) continue;
            if (vistoria.getDataAgendada() == null) continue;

            // Already notified?
            if (notificacaoService.notificacaoJaEnviada(TipoNotificacao.VISTORIA_AGENDADA, vistoria.getId())) {
                continue;
            }

            LocalDateTime dataAgendada = vistoria.getDataAgendada();
            long horasParaVistoria = ChronoUnit.HOURS.between(agora, dataAgendada);

            if (horasParaVistoria >= 0 && horasParaVistoria <= 48) {
                String condominioNome = condominioRepository.findById(vistoria.getCondominioId())
                    .map(Condominio::getNome).orElse("N/A");

                String quando = horasParaVistoria <= 24 ? "hoje" : "amanha";
                String titulo = "Vistoria agendada para " + quando;
                String mensagem = String.format("[%s] Vistoria %s agendada para %s. Responsavel: %s",
                    condominioNome,
                    vistoria.getTipo().name(),
                    dataAgendada.toLocalDate(),
                    vistoria.getResponsavelNome() != null ? vistoria.getResponsavelNome() : "N/A");

                notificacoesEnviadas += notificarUsuariosRelevantes(
                    TipoNotificacao.VISTORIA_AGENDADA, titulo, mensagem, "VISTORIA", vistoria.getId());
            }
        }

        log.info("Vistorias: {} notificacoes enviadas.", notificacoesEnviadas);
        return notificacoesEnviadas;
    }

    // ===== Sinistros Atualizados =====

    private int verificarSinistrosAtualizados() {
        log.info("Verificando sinistros atualizados...");

        LocalDateTime ultimas24h = LocalDateTime.now().minusHours(24);
        int notificacoesEnviadas = 0;

        // Check sinistros in active statuses
        List<StatusSinistro> statusAtivos = List.of(
            StatusSinistro.EM_ANALISE,
            StatusSinistro.APROVADO,
            StatusSinistro.NEGADO,
            StatusSinistro.PAGO
        );

        for (StatusSinistro status : statusAtivos) {
            List<Sinistro> sinistros = sinistroRepository.findByStatusAndActiveTrue(status);

            for (Sinistro sinistro : sinistros) {
                if (sinistro.getUpdatedAt() == null) continue;
                if (sinistro.getUpdatedAt().isBefore(ultimas24h)) continue;

                // Already notified?
                if (notificacaoService.notificacaoJaEnviada(TipoNotificacao.SINISTRO_ATUALIZADO, sinistro.getId())) {
                    continue;
                }

                String condominioNome = condominioRepository.findById(sinistro.getCondominioId())
                    .map(Condominio::getNome).orElse("N/A");

                String titulo = "Sinistro atualizado: " + status.name();
                String mensagem = String.format("[%s] Sinistro #%s (%s) teve status atualizado para %s.",
                    condominioNome,
                    sinistro.getNumeroSinistro() != null ? sinistro.getNumeroSinistro() : sinistro.getId().toString().substring(0, 8),
                    sinistro.getTipo().name(),
                    status.name());

                notificacoesEnviadas += notificarUsuariosRelevantes(
                    TipoNotificacao.SINISTRO_ATUALIZADO, titulo, mensagem, "SINISTRO", sinistro.getId());
            }
        }

        log.info("Sinistros: {} notificacoes enviadas.", notificacoesEnviadas);
        return notificacoesEnviadas;
    }

    // ===== Helpers =====

    private int notificarUsuariosRelevantes(TipoNotificacao tipo, String titulo, String mensagem,
                                             String referenciaTipo, java.util.UUID referenciaId) {
        List<User> usuarios = userRepository.findByRoleInAndActiveTrue(
            List.of(Role.ADMIN, Role.CORRETORA)
        );

        int count = 0;
        for (User user : usuarios) {
            notificacaoService.criarNotificacao(user.getId(), tipo, titulo, mensagem, referenciaTipo, referenciaId);
            count++;
        }
        return count;
    }

    // Manual trigger via endpoint
    @Transactional
    public int verificarManualmente() {
        executarVerificacaoDiaria();
        return 0;
    }
}
