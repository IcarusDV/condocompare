package com.condocompare.notificacoes.repository;

import com.condocompare.notificacoes.entity.Notificacao;
import com.condocompare.notificacoes.entity.TipoNotificacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, UUID> {

    Page<Notificacao> findByUserIdAndActiveTrueOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<Notificacao> findByUserIdAndLidaFalseAndActiveTrueOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndLidaFalseAndActiveTrue(UUID userId);

    @Modifying
    @Query("UPDATE Notificacao n SET n.lida = true, n.dataLeitura = CURRENT_TIMESTAMP WHERE n.userId = :userId AND n.lida = false")
    void markAllAsReadByUserId(@Param("userId") UUID userId);

    @Query("SELECT n FROM Notificacao n WHERE n.active = true AND n.tipo = :tipo AND n.referenciaId = :referenciaId")
    List<Notificacao> findByTipoAndReferenciaId(
        @Param("tipo") TipoNotificacao tipo,
        @Param("referenciaId") UUID referenciaId
    );

    boolean existsByTipoAndReferenciaIdAndActiveTrue(TipoNotificacao tipo, UUID referenciaId);
}
