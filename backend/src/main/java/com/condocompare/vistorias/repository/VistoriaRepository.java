package com.condocompare.vistorias.repository;

import com.condocompare.vistorias.entity.StatusVistoria;
import com.condocompare.vistorias.entity.TipoVistoria;
import com.condocompare.vistorias.entity.Vistoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VistoriaRepository extends JpaRepository<Vistoria, UUID> {

    @Query(value = "SELECT v.* FROM condocompare.vistorias v WHERE v.active = true AND " +
           "(CAST(:condominioId AS uuid) IS NULL OR v.condominio_id = :condominioId) AND " +
           "(CAST(:tipo AS varchar) IS NULL OR v.tipo = :tipo) AND " +
           "(CAST(:status AS varchar) IS NULL OR v.status = :status) " +
           "ORDER BY v.data_agendada DESC",
           countQuery = "SELECT COUNT(*) FROM condocompare.vistorias v WHERE v.active = true AND " +
           "(CAST(:condominioId AS uuid) IS NULL OR v.condominio_id = :condominioId) AND " +
           "(CAST(:tipo AS varchar) IS NULL OR v.tipo = :tipo) AND " +
           "(CAST(:status AS varchar) IS NULL OR v.status = :status)",
           nativeQuery = true)
    Page<Vistoria> findAllWithFilters(
        @Param("condominioId") UUID condominioId,
        @Param("tipo") String tipo,
        @Param("status") String status,
        Pageable pageable
    );

    List<Vistoria> findByCondominioIdAndActiveTrue(UUID condominioId);

    List<Vistoria> findByStatusAndActiveTrue(StatusVistoria status);

    @Query("SELECT v FROM Vistoria v WHERE v.active = true AND v.status = 'AGENDADA' " +
           "AND v.dataAgendada BETWEEN :inicio AND :fim")
    List<Vistoria> findVistoriasAgendadasEntre(
        @Param("inicio") LocalDateTime inicio,
        @Param("fim") LocalDateTime fim
    );

    @Query("SELECT COUNT(v) FROM Vistoria v WHERE v.active = true AND v.condominioId = :condominioId")
    long countByCondominioId(@Param("condominioId") UUID condominioId);

    @Query("SELECT COUNT(v) FROM Vistoria v WHERE v.active = true")
    long countActive();

    @Query("SELECT COUNT(v) FROM Vistoria v WHERE v.active = true AND v.status = :status")
    long countByStatus(@Param("status") StatusVistoria status);

    @Query(value = "SELECT TO_CHAR(v.data_agendada, 'YYYY-MM') as month, COUNT(*) as count " +
           "FROM condocompare.vistorias v WHERE v.active = true " +
           "AND v.data_agendada >= NOW() - INTERVAL '12 months' " +
           "GROUP BY TO_CHAR(v.data_agendada, 'YYYY-MM') " +
           "ORDER BY month", nativeQuery = true)
    List<Object[]> countGroupByMonth();

    @Query(value = "SELECT v.* FROM condocompare.vistorias v WHERE v.active = true ORDER BY v.created_at DESC LIMIT :limit", nativeQuery = true)
    List<Vistoria> findRecentActive(@Param("limit") int limit);

    @Query(value = "SELECT v.* FROM condocompare.vistorias v WHERE v.active = true AND " +
           "v.condominio_id IN :allowedIds AND " +
           "(CAST(:condominioId AS uuid) IS NULL OR v.condominio_id = :condominioId) AND " +
           "(CAST(:tipo AS varchar) IS NULL OR v.tipo = :tipo) AND " +
           "(CAST(:status AS varchar) IS NULL OR v.status = :status) " +
           "ORDER BY v.data_agendada DESC",
           countQuery = "SELECT COUNT(*) FROM condocompare.vistorias v WHERE v.active = true AND " +
           "v.condominio_id IN :allowedIds AND " +
           "(CAST(:condominioId AS uuid) IS NULL OR v.condominio_id = :condominioId) AND " +
           "(CAST(:tipo AS varchar) IS NULL OR v.tipo = :tipo) AND " +
           "(CAST(:status AS varchar) IS NULL OR v.status = :status)",
           nativeQuery = true)
    Page<Vistoria> findAllWithFiltersRestricted(
        @Param("allowedIds") List<UUID> allowedIds,
        @Param("condominioId") UUID condominioId,
        @Param("tipo") String tipo,
        @Param("status") String status,
        Pageable pageable
    );

    Optional<Vistoria> findBySharedTokenAndActiveTrue(String sharedToken);

    /**
     * Fetches condominio names for a list of condominio IDs in a single query.
     * Used to resolve N+1 in findAll pagination.
     */
    @Query(value = "SELECT c.id, c.nome FROM condocompare.condominios c WHERE c.id IN :ids", nativeQuery = true)
    List<Object[]> findCondominioNamesByIds(@Param("ids") List<UUID> ids);
}
