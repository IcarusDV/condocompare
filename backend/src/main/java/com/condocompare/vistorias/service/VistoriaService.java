package com.condocompare.vistorias.service;

import com.condocompare.common.exception.BusinessException;
import com.condocompare.common.exception.ResourceNotFoundException;
import com.condocompare.condominios.entity.Condominio;
import com.condocompare.condominios.repository.CondominioRepository;
import com.condocompare.users.entity.Role;
import com.condocompare.users.entity.User;
import com.condocompare.users.repository.UserRepository;
import com.condocompare.vistorias.dto.*;
import com.condocompare.vistorias.entity.*;
import com.condocompare.vistorias.repository.VistoriaRepository;
import com.condocompare.vistorias.repository.VistoriaItemRepository;
import com.condocompare.vistorias.repository.VistoriaFotoRepository;
import com.condocompare.ia.service.IAService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VistoriaService {

    private final VistoriaRepository vistoriaRepository;
    private final VistoriaItemRepository vistoriaItemRepository;
    private final VistoriaFotoRepository vistoriaFotoRepository;
    private final CondominioRepository condominioRepository;
    private final UserRepository userRepository;
    private final IAService iaService;

    @Transactional
    public VistoriaResponse create(CreateVistoriaRequest request) {
        User currentUser = getCurrentUser();

        // Validate condominio exists
        Condominio condominio = condominioRepository.findById(request.condominioId())
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        Vistoria vistoria = Vistoria.builder()
            .condominioId(request.condominioId())
            .tipo(request.tipo())
            .status(StatusVistoria.AGENDADA)
            .dataAgendada(request.dataAgendada())
            .responsavelNome(request.responsavelNome())
            .responsavelTelefone(request.responsavelTelefone())
            .responsavelEmail(request.responsavelEmail())
            .observacoes(request.observacoes())
            .build();

        vistoria.setCreatedBy(currentUser.getId().toString());
        vistoria.setActive(true);

        Vistoria saved = vistoriaRepository.save(vistoria);
        log.info("Vistoria created: id={}, condominio={}, user={}",
            saved.getId(), request.condominioId(), currentUser.getEmail());

        return toResponse(saved, condominio.getNome());
    }

    @Transactional
    public VistoriaResponse update(UUID id, UpdateVistoriaRequest request) {
        User currentUser = getCurrentUser();

        Vistoria vistoria = vistoriaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vistoria não encontrada"));

        if (!vistoria.isActive()) {
            throw new BusinessException("Vistoria não está ativa");
        }

        Condominio condominio = condominioRepository.findById(vistoria.getCondominioId())
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        if (request.tipo() != null) vistoria.setTipo(request.tipo());
        if (request.status() != null) vistoria.setStatus(request.status());
        if (request.dataAgendada() != null) vistoria.setDataAgendada(request.dataAgendada());
        if (request.dataRealizada() != null) vistoria.setDataRealizada(request.dataRealizada());
        if (request.responsavelNome() != null) vistoria.setResponsavelNome(request.responsavelNome());
        if (request.responsavelTelefone() != null) vistoria.setResponsavelTelefone(request.responsavelTelefone());
        if (request.responsavelEmail() != null) vistoria.setResponsavelEmail(request.responsavelEmail());
        if (request.observacoes() != null) vistoria.setObservacoes(request.observacoes());
        if (request.laudoUrl() != null) vistoria.setLaudoUrl(request.laudoUrl());
        if (request.documentoId() != null) vistoria.setDocumentoId(request.documentoId());
        if (request.itensVistoriados() != null) vistoria.setItensVistoriados(request.itensVistoriados());
        if (request.pendencias() != null) vistoria.setPendencias(request.pendencias());
        if (request.notaGeral() != null) vistoria.setNotaGeral(request.notaGeral());

        vistoria.setUpdatedBy(currentUser.getId().toString());

        Vistoria saved = vistoriaRepository.save(vistoria);
        log.info("Vistoria updated: id={}, user={}", id, currentUser.getEmail());

        return toResponse(saved, condominio.getNome());
    }

    @Transactional(readOnly = true)
    public VistoriaResponse findById(UUID id) {
        User currentUser = getCurrentUser();

        Vistoria vistoria = vistoriaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vistoria não encontrada"));

        if (!vistoria.isActive()) {
            throw new ResourceNotFoundException("Vistoria não encontrada");
        }

        checkCondominioAccess(currentUser, vistoria.getCondominioId());

        Condominio condominio = condominioRepository.findById(vistoria.getCondominioId())
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        return toResponse(vistoria, condominio.getNome());
    }

    @Transactional(readOnly = true)
    public Page<VistoriaListResponse> findAll(UUID condominioId, TipoVistoria tipo, StatusVistoria status, Pageable pageable) {
        User currentUser = getCurrentUser();
        String tipoStr = tipo != null ? tipo.name() : null;
        String statusStr = status != null ? status.name() : null;

        List<UUID> allowedIds = getAllowedCondominioIds(currentUser);
        Page<Vistoria> vistorias;
        if (allowedIds != null) {
            if (allowedIds.isEmpty()) {
                return Page.empty(pageable);
            }
            vistorias = vistoriaRepository.findAllWithFiltersRestricted(allowedIds, condominioId, tipoStr, statusStr, pageable);
        } else {
            vistorias = vistoriaRepository.findAllWithFilters(condominioId, tipoStr, statusStr, pageable);
        }

        // Batch-fetch condominio names in a single query (eliminates N+1)
        List<UUID> condominioIds = vistorias.getContent().stream()
            .map(Vistoria::getCondominioId)
            .distinct()
            .toList();

        Map<UUID, String> condominioNames = Map.of();
        if (!condominioIds.isEmpty()) {
            condominioNames = vistoriaRepository.findCondominioNamesByIds(condominioIds)
                .stream()
                .collect(Collectors.toMap(
                    row -> (UUID) row[0],
                    row -> (String) row[1]
                ));
        }

        final Map<UUID, String> names = condominioNames;
        return vistorias.map(v -> toListResponse(v, names.getOrDefault(v.getCondominioId(), "N/A")));
    }

    @Transactional(readOnly = true)
    public List<VistoriaListResponse> findByCondominio(UUID condominioId) {
        Condominio condominio = condominioRepository.findById(condominioId)
            .orElseThrow(() -> new ResourceNotFoundException("Condomínio não encontrado"));

        return vistoriaRepository.findByCondominioIdAndActiveTrue(condominioId)
            .stream()
            .map(v -> toListResponse(v, condominio.getNome()))
            .toList();
    }

    @Transactional
    public void delete(UUID id) {
        User currentUser = getCurrentUser();

        Vistoria vistoria = vistoriaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vistoria não encontrada"));

        vistoria.setActive(false);
        vistoria.setUpdatedBy(currentUser.getId().toString());
        vistoriaRepository.save(vistoria);

        log.info("Vistoria deleted: id={}, user={}", id, currentUser.getEmail());
    }

    /**
     * Returns list of condominio IDs the user can access, or null for unrestricted access.
     */
    private List<UUID> getAllowedCondominioIds(User user) {
        return switch (user.getRole()) {
            case ADMINISTRADORA -> condominioRepository.findIdsByAdministradoraId(user.getOrganizationId());
            case SINDICO -> condominioRepository.findIdsBySindicoId(user.getId());
            case ADMIN, CORRETORA -> null; // unrestricted
        };
    }

    private void checkCondominioAccess(User user, UUID condominioId) {
        List<UUID> allowed = getAllowedCondominioIds(user);
        if (allowed != null && !allowed.contains(condominioId)) {
            throw new BusinessException("Sem permissão para acessar esta vistoria");
        }
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
    }

    private VistoriaResponse toResponse(Vistoria v, String condominioNome) {
        return new VistoriaResponse(
            v.getId(),
            v.getCondominioId(),
            condominioNome,
            v.getTipo(),
            v.getStatus(),
            v.getDataAgendada(),
            v.getDataRealizada(),
            v.getResponsavelNome(),
            v.getResponsavelTelefone(),
            v.getResponsavelEmail(),
            v.getObservacoes(),
            v.getLaudoUrl(),
            v.getLaudoTexto(),
            v.getLaudoGeradoEm(),
            v.getDocumentoId(),
            v.getItensVistoriados(),
            v.getPendencias(),
            v.getNotaGeral(),
            v.getTotalItens(),
            v.getItensConformes(),
            v.getItensNaoConformes(),
            v.getCreatedAt(),
            v.getUpdatedAt(),
            v.getSharedToken()
        );
    }

    // ===== External Link Sharing =====

    @Transactional
    public SharedLinkResponse generateSharedLink(UUID id) {
        User currentUser = getCurrentUser();

        Vistoria vistoria = vistoriaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vistoria nao encontrada"));

        if (!vistoria.isActive()) {
            throw new BusinessException("Vistoria nao esta ativa");
        }

        String token = UUID.randomUUID().toString();
        vistoria.setSharedToken(token);
        vistoria.setUpdatedBy(currentUser.getId().toString());
        vistoriaRepository.save(vistoria);

        log.info("Shared link generated: vistoriaId={}, user={}", id, currentUser.getEmail());

        return new SharedLinkResponse(token, "/vistoria-externa/" + token);
    }

    @Transactional(readOnly = true)
    public ExternalVistoriaResponse findBySharedToken(String token) {
        Vistoria vistoria = vistoriaRepository.findBySharedTokenAndActiveTrue(token)
            .orElseThrow(() -> new ResourceNotFoundException("Vistoria nao encontrada ou link invalido"));

        Condominio condominio = condominioRepository.findById(vistoria.getCondominioId())
            .orElseThrow(() -> new ResourceNotFoundException("Condominio nao encontrado"));

        List<VistoriaItem> itens = vistoriaItemRepository.findByVistoriaIdOrderByOrdem(vistoria.getId());
        List<VistoriaFoto> fotos = vistoriaFotoRepository.findByVistoriaId(vistoria.getId());

        return new ExternalVistoriaResponse(
            vistoria.getId(),
            condominio.getNome(),
            vistoria.getTipo(),
            vistoria.getStatus(),
            vistoria.getDataAgendada(),
            vistoria.getDataRealizada(),
            vistoria.getResponsavelNome(),
            vistoria.getObservacoes(),
            vistoria.getLaudoTexto(),
            vistoria.getLaudoGeradoEm(),
            vistoria.getNotaGeral(),
            vistoria.getTotalItens(),
            vistoria.getItensConformes(),
            vistoria.getItensNaoConformes(),
            itens,
            fotos,
            vistoria.getCreatedAt()
        );
    }

    @Transactional
    public void revokeSharedLink(UUID id) {
        User currentUser = getCurrentUser();

        Vistoria vistoria = vistoriaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vistoria nao encontrada"));

        vistoria.setSharedToken(null);
        vistoria.setUpdatedBy(currentUser.getId().toString());
        vistoriaRepository.save(vistoria);

        log.info("Shared link revoked: vistoriaId={}, user={}", id, currentUser.getEmail());
    }

    // ===== Checklist Items =====

    @Transactional(readOnly = true)
    public List<VistoriaItem> getItens(UUID vistoriaId) {
        return vistoriaItemRepository.findByVistoriaIdOrderByOrdem(vistoriaId);
    }

    @Transactional
    public VistoriaItem addItem(VistoriaItem item) {
        VistoriaItem saved = vistoriaItemRepository.save(item);
        updateVistoriaCounts(item.getVistoriaId());
        return saved;
    }

    @Transactional
    public VistoriaItem updateItem(VistoriaItem item) {
        VistoriaItem existing = vistoriaItemRepository.findById(item.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Item nao encontrado"));
        existing.setCategoria(item.getCategoria());
        existing.setDescricao(item.getDescricao());
        existing.setStatus(item.getStatus());
        existing.setSeveridade(item.getSeveridade());
        existing.setObservacao(item.getObservacao());
        existing.setOrdem(item.getOrdem());
        VistoriaItem saved = vistoriaItemRepository.save(existing);
        updateVistoriaCounts(item.getVistoriaId());
        return saved;
    }

    @Transactional
    public void deleteItem(UUID itemId) {
        VistoriaItem item = vistoriaItemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("Item nao encontrado"));
        UUID vistoriaId = item.getVistoriaId();
        vistoriaItemRepository.delete(item);
        updateVistoriaCounts(vistoriaId);
    }

    @Transactional
    public List<VistoriaItem> loadDefaultChecklist(UUID vistoriaId) {
        // Delete existing items
        vistoriaItemRepository.deleteByVistoriaId(vistoriaId);

        // Default checklist items for condominium inspection
        String[][] defaultItems = {
            {"Estrutural", "Estado da fachada e pintura externa"},
            {"Estrutural", "Condicao da cobertura/telhado"},
            {"Estrutural", "Impermeabilizacao de lajes e coberturas"},
            {"Estrutural", "Estado das esquadrias e janelas"},
            {"Eletrica", "Quadro de distribuicao geral"},
            {"Eletrica", "Estado da fiacao e cabeamento"},
            {"Eletrica", "Iluminacao das areas comuns"},
            {"Eletrica", "Para-raios (SPDA) e aterramento"},
            {"Hidraulica", "Caixas d'agua e cisternas"},
            {"Hidraulica", "Bombas de recalque e pressao"},
            {"Hidraulica", "Estado das tubulacoes visiveis"},
            {"Hidraulica", "Sistema de drenagem pluvial"},
            {"Incendio", "Extintores (validade e conservacao)"},
            {"Incendio", "Hidrantes e mangueiras"},
            {"Incendio", "Sinalizacao de emergencia"},
            {"Incendio", "Saidas de emergencia (desobstrucao)"},
            {"Elevadores", "Certificado de manutencao atualizado"},
            {"Elevadores", "Estado geral das cabines"},
            {"Areas Comuns", "Piscina (quando aplicavel)"},
            {"Areas Comuns", "Playground e areas de lazer"},
            {"Areas Comuns", "Garagem (sinalizacao e ventilacao)"},
            {"Areas Comuns", "Portaria e controle de acesso"},
            {"Seguranca", "Cameras de CFTV"},
            {"Seguranca", "Interfones e porteiros eletronicos"},
            {"Gas", "Central de gas e tubulacoes"},
        };

        List<VistoriaItem> items = new ArrayList<>();
        for (int i = 0; i < defaultItems.length; i++) {
            VistoriaItem item = VistoriaItem.builder()
                .vistoriaId(vistoriaId)
                .categoria(defaultItems[i][0])
                .descricao(defaultItems[i][1])
                .status("PENDENTE")
                .severidade("BAIXA")
                .ordem(i)
                .build();
            items.add(item);
        }

        // Batch save all items at once (uses Hibernate batch_size setting)
        List<VistoriaItem> savedItems = vistoriaItemRepository.saveAll(items);

        updateVistoriaCounts(vistoriaId);
        return savedItems;
    }

    private void updateVistoriaCounts(UUID vistoriaId) {
        Vistoria vistoria = vistoriaRepository.findById(vistoriaId).orElse(null);
        if (vistoria == null) return;

        List<VistoriaItem> itens = vistoriaItemRepository.findByVistoriaIdOrderByOrdem(vistoriaId);
        int total = itens.size();
        int conformes = (int) itens.stream().filter(i -> "CONFORME".equals(i.getStatus())).count();
        int naoConformes = (int) itens.stream().filter(i -> "NAO_CONFORME".equals(i.getStatus())).count();

        vistoria.setTotalItens(total);
        vistoria.setItensConformes(conformes);
        vistoria.setItensNaoConformes(naoConformes);

        // Auto-calculate nota based on conformes
        if (total > 0) {
            vistoria.setNotaGeral((int) Math.round((conformes * 10.0) / total));
        }

        vistoriaRepository.save(vistoria);
    }

    // ===== Fotos =====

    @Transactional(readOnly = true)
    public List<VistoriaFoto> getFotos(UUID vistoriaId) {
        return vistoriaFotoRepository.findByVistoriaId(vistoriaId);
    }

    @Transactional
    public VistoriaFoto addFoto(VistoriaFoto foto) {
        return vistoriaFotoRepository.save(foto);
    }

    @Transactional
    public void deleteFoto(UUID fotoId) {
        vistoriaFotoRepository.deleteById(fotoId);
    }

    // ===== Laudo =====

    @Transactional
    public VistoriaResponse gerarLaudo(UUID id) {
        Vistoria vistoria = vistoriaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vistoria nao encontrada"));

        Condominio condominio = condominioRepository.findById(vistoria.getCondominioId())
            .orElseThrow(() -> new ResourceNotFoundException("Condominio nao encontrado"));

        List<VistoriaItem> itens = vistoriaItemRepository.findByVistoriaIdOrderByOrdem(id);
        List<VistoriaFoto> fotos = vistoriaFotoRepository.findByVistoriaId(id);

        String laudoTexto = null;

        // Try IA-generated laudo first
        try {
            laudoTexto = generateLaudoWithIA(vistoria, condominio, itens, fotos);
        } catch (Exception e) {
            log.warn("Falha ao gerar laudo com IA, usando fallback: {}", e.getMessage());
        }

        // Fallback to static laudo
        if (laudoTexto == null || laudoTexto.isBlank()) {
            laudoTexto = generateStaticLaudo(vistoria, condominio, itens);
        }

        vistoria.setLaudoTexto(laudoTexto);
        vistoria.setLaudoGeradoEm(LocalDateTime.now());
        Vistoria saved = vistoriaRepository.save(vistoria);

        return toResponse(saved, condominio.getNome());
    }

    private String generateLaudoWithIA(Vistoria vistoria, Condominio condominio,
                                        List<VistoriaItem> itens, List<VistoriaFoto> fotos) {
        List<Map<String, Object>> itensData = itens.stream().map(i -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("categoria", i.getCategoria());
            m.put("descricao", i.getDescricao());
            m.put("status", i.getStatus());
            m.put("severidade", i.getSeveridade() != null ? i.getSeveridade() : "");
            m.put("observacao", i.getObservacao() != null ? i.getObservacao() : "");
            return m;
        }).toList();

        List<String> fotosDescricoes = fotos.stream()
            .filter(f -> f.getDescricao() != null && !f.getDescricao().isBlank())
            .map(VistoriaFoto::getDescricao)
            .toList();

        int total = itens.size();
        long conformes = itens.stream().filter(i -> "CONFORME".equals(i.getStatus())).count();
        Integer notaGeral = total > 0 ? (int) ((conformes * 100.0) / total) : null;

        Map<String, Object> request = new java.util.HashMap<>();
        request.put("condominio_nome", condominio.getNome());
        request.put("condominio_endereco", condominio.getEndereco() != null ? condominio.getEndereco() : "");
        request.put("condominio_tipo", condominio.getTipoConstrucao() != null ? condominio.getTipoConstrucao() : "");
        request.put("tipo_vistoria", vistoria.getTipo().name());
        request.put("data_vistoria", vistoria.getDataRealizada() != null ?
            vistoria.getDataRealizada().toString() : vistoria.getDataAgendada().toString());
        request.put("responsavel_nome", vistoria.getResponsavelNome() != null ? vistoria.getResponsavelNome() : "");
        request.put("itens", itensData);
        request.put("observacoes", vistoria.getObservacoes() != null ? vistoria.getObservacoes() : "");
        request.put("fotos_descricoes", fotosDescricoes);
        request.put("nota_geral", notaGeral);

        return iaService.generateLaudo(request);
    }

    private String generateStaticLaudo(Vistoria vistoria, Condominio condominio, List<VistoriaItem> itens) {
        StringBuilder laudo = new StringBuilder();
        laudo.append("LAUDO TECNICO DE VISTORIA\n");
        laudo.append("========================\n\n");
        laudo.append("Condominio: ").append(condominio.getNome()).append("\n");
        laudo.append("Data Vistoria: ").append(vistoria.getDataRealizada() != null ?
            vistoria.getDataRealizada().toString() : vistoria.getDataAgendada().toString()).append("\n");
        laudo.append("Responsavel: ").append(vistoria.getResponsavelNome() != null ?
            vistoria.getResponsavelNome() : "N/A").append("\n\n");

        int total = itens.size();
        long conformes = itens.stream().filter(i -> "CONFORME".equals(i.getStatus())).count();
        long naoConformes = itens.stream().filter(i -> "NAO_CONFORME".equals(i.getStatus())).count();
        long pendentes = itens.stream().filter(i -> "PENDENTE".equals(i.getStatus())).count();

        laudo.append("RESUMO:\n");
        laudo.append(String.format("- Total de itens: %d\n", total));
        laudo.append(String.format("- Conformes: %d\n", conformes));
        laudo.append(String.format("- Nao conformes: %d\n", naoConformes));
        laudo.append(String.format("- Pendentes: %d\n\n", pendentes));

        if (naoConformes > 0) {
            laudo.append("ITENS NAO CONFORMES:\n");
            itens.stream()
                .filter(i -> "NAO_CONFORME".equals(i.getStatus()))
                .forEach(i -> {
                    laudo.append(String.format("- [%s] %s", i.getCategoria(), i.getDescricao()));
                    if (i.getSeveridade() != null) laudo.append(" (Severidade: ").append(i.getSeveridade()).append(")");
                    if (i.getObservacao() != null) laudo.append("\n  Obs: ").append(i.getObservacao());
                    laudo.append("\n");
                });
            laudo.append("\n");
        }

        if (total > 0) {
            double score = (conformes * 100.0) / total;
            laudo.append(String.format("NOTA GERAL: %.0f%%\n", score));
            laudo.append("CLASSIFICACAO: ");
            if (score >= 80) laudo.append("BOM");
            else if (score >= 60) laudo.append("REGULAR - ATENCAO NECESSARIA");
            else laudo.append("CRITICO - ACAO IMEDIATA NECESSARIA");
            laudo.append("\n");
        }

        return laudo.toString();
    }

    private VistoriaListResponse toListResponse(Vistoria v, String condominioNome) {
        return new VistoriaListResponse(
            v.getId(),
            v.getCondominioId(),
            condominioNome,
            v.getTipo(),
            v.getStatus(),
            v.getDataAgendada(),
            v.getDataRealizada(),
            v.getResponsavelNome(),
            v.getNotaGeral(),
            v.getPendencias() != null ? v.getPendencias().size() : 0,
            v.getCreatedAt()
        );
    }
}
