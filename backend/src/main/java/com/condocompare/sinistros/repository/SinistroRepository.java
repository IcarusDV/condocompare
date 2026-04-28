package com.condocompare.sinistros.repository;

import com.condocompare.sinistros.entity.Sinistro;
import com.condocompare.sinistros.entity.StatusSinistro;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface SinistroRepository extends JpaRepository<Sinistro, UUID> {

    @Query(value = "SELECT s.* FROM condocompare.sinistros s WHERE s.active = true AND " +
           "(CAST(:condominioId AS uuid) IS NULL OR s.condominio_id = :condominioId) AND " +
           "(CAST(:tipo AS varchar) IS NULL OR s.tipo = :tipo) AND " +
           "(CAST(:status AS varchar) IS NULL OR s.status = :status) " +
           "ORDER BY s.data_ocorrencia DESC",
           countQuery = "SELECT COUNT(*) FROM condocompare.sinistros s WHERE s.active = true AND " +
           "(CAST(:condominioId AS uuid) IS NULL OR s.condominio_id = :condominioId) AND " +
           "(CAST(:tipo AS varchar) IS NULL OR s.tipo = :tipo) AND " +
           "(CAST(:status AS varchar) IS NULL OR s.status = :status)",
           nativeQuery = true)
    Page<Sinistro> findAllWithFilters(
        @Param("condominioId") UUID condominioId,
        @Param("tipo") String tipo,
        @Param("status") String status,
        Pageable pageable
    );

    List<Sinistro> findByCondominioIdAndActiveTrue(UUID condominioId);

    List<Sinistro> findByStatusAndActiveTrue(StatusSinistro status);

    @Query("SELECT COUNT(s) FROM Sinistro s WHERE s.active = true AND s.condominioId = :condominioId")
    long countByCondominioId(@Param("condominioId") UUID condominioId);

    @Query("SELECT COUNT(s) FROM Sinistro s WHERE s.active = true")
    long countActive();

    @Query("SELECT COUNT(s) FROM Sinistro s WHERE s.active = true AND s.status = :status")
    long countByStatus(@Param("status") StatusSinistro status);

    @Query("SELECT COALESCE(SUM(s.valorPrejuizo), 0) FROM Sinistro s WHERE s.active = true")
    BigDecimal sumValorPrejuizo();

    @Query("SELECT COALESCE(SUM(s.valorIndenizado), 0) FROM Sinistro s WHERE s.active = true AND s.status = 'PAGO'")
    BigDecimal sumValorIndenizado();

    @Query("SELECT s.status, COUNT(s) FROM Sinistro s WHERE s.active = true GROUP BY s.status")
    List<Object[]> countGroupByStatus();

    @Query(value = "SELECT s.* FROM condocompare.sinistros s WHERE s.active = true ORDER BY s.created_at DESC LIMIT :limit", nativeQuery = true)
    List<Sinistro> findRecentActive(@Param("limit") int limit);

    @Query(value = "SELECT c.id, c.nome FROM condocompare.condominios c WHERE c.id IN :ids", nativeQuery = true)
    List<Object[]> findCondominioNamesByIds(@Param("ids") List<UUID> ids);

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (s.updated_at - s.data_ocorrencia)) / 86400) " +
           "FROM condocompare.sinistros s WHERE s.active = true AND s.status IN ('PAGO', 'NEGADO', 'APROVADO')",
           nativeQuery = true)
    Double avgResolucaoDias();

    @Query(value = "SELECT TO_CHAR(s.data_ocorrencia, 'YYYY-MM') as mes, COUNT(*) as total " +
           "FROM condocompare.sinistros s WHERE s.active = true " +
           "AND s.data_ocorrencia >= NOW() - INTERVAL '12 months' " +
           "GROUP BY TO_CHAR(s.data_ocorrencia, 'YYYY-MM') ORDER BY mes", nativeQuery = true)
    List<Object[]> countByMonth();

    @Query(value = "SELECT s.* FROM condocompare.sinistros s WHERE s.active = true AND " +
           "s.condominio_id IN :allowedIds AND " +
           "(CAST(:condominioId AS uuid) IS NULL OR s.condominio_id = :condominioId) AND " +
           "(CAST(:tipo AS varchar) IS NULL OR s.tipo = :tipo) AND " +
           "(CAST(:status AS varchar) IS NULL OR s.status = :status) " +
           "ORDER BY s.data_ocorrencia DESC",
           countQuery = "SELECT COUNT(*) FROM condocompare.sinistros s WHERE s.active = true AND " +
           "s.condominio_id IN :allowedIds AND " +
           "(CAST(:condominioId AS uuid) IS NULL OR s.condominio_id = :condominioId) AND " +
           "(CAST(:tipo AS varchar) IS NULL OR s.tipo = :tipo) AND " +
           "(CAST(:status AS varchar) IS NULL OR s.status = :status)",
           nativeQuery = true)
    Page<Sinistro> findAllWithFiltersRestricted(
        @Param("allowedIds") List<UUID> allowedIds,
        @Param("condominioId") UUID condominioId,
        @Param("tipo") String tipo,
        @Param("status") String status,
        Pageable pageable
    );
}
