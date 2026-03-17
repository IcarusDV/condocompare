package com.condocompare.documentos.repository;

import com.condocompare.documentos.entity.Documento;
import com.condocompare.documentos.entity.StatusProcessamento;
import com.condocompare.documentos.entity.TipoDocumento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentoRepository extends JpaRepository<Documento, UUID>, JpaSpecificationExecutor<Documento> {

    List<Documento> findByCondominioIdAndActiveTrue(UUID condominioId);

    Page<Documento> findByCondominioIdAndActiveTrue(UUID condominioId, Pageable pageable);

    List<Documento> findByCondominioIdAndTipoAndActiveTrue(UUID condominioId, TipoDocumento tipo);

    List<Documento> findByCondominioIdAndTipoAndStatusAndActiveTrue(
        UUID condominioId,
        TipoDocumento tipo,
        StatusProcessamento status
    );

    @Query("SELECT d FROM Documento d WHERE d.condominioId = :condominioId " +
           "AND d.tipo = 'ORCAMENTO' AND d.status = 'CONCLUIDO' AND d.active = true " +
           "ORDER BY d.createdAt DESC")
    List<Documento> findOrcamentosProcessados(@Param("condominioId") UUID condominioId);

    @Query("SELECT d FROM Documento d WHERE d.status = :status AND d.active = true")
    List<Documento> findByStatus(@Param("status") StatusProcessamento status);

    long countByCondominioIdAndActiveTrue(UUID condominioId);

    long countByCondominioIdAndTipoAndActiveTrue(UUID condominioId, TipoDocumento tipo);

    @Query("SELECT d FROM Documento d WHERE d.condominioId = :condominioId " +
           "AND d.tipo = 'APOLICE' AND d.active = true " +
           "ORDER BY d.createdAt DESC LIMIT 1")
    Documento findApoliceAtual(@Param("condominioId") UUID condominioId);

    List<Documento> findByTipoAndActiveTrue(TipoDocumento tipo);

    @Query(value = "SELECT d.id, d.nome, d.data_vigencia_fim, d.seguradora_nome, c.id as condominio_id, c.nome as condominio_nome " +
           "FROM condocompare.documentos d " +
           "JOIN condocompare.condominios c ON c.id = d.condominio_id " +
           "WHERE d.tipo = 'APOLICE' AND d.active = true " +
           "AND d.data_vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' " +
           "ORDER BY d.data_vigencia_fim ASC " +
           "LIMIT 5", nativeQuery = true)
    List<Object[]> findApolicesVencendo30Dias();

    @Query(value = "SELECT COUNT(*) FROM condocompare.documentos d " +
           "WHERE d.tipo = 'APOLICE' AND d.active = true " +
           "AND d.data_vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'",
           nativeQuery = true)
    long countApolicesVencendo30Dias();

    @Query("SELECT COUNT(d) FROM Documento d WHERE d.active = true")
    long countActive();

    @Query("SELECT COUNT(d) FROM Documento d WHERE d.active = true AND d.tipo = :tipo")
    long countByTipo(@Param("tipo") TipoDocumento tipo);

    @Query("SELECT d.tipo, COUNT(d) FROM Documento d WHERE d.active = true GROUP BY d.tipo")
    List<Object[]> countGroupByTipo();

    @Query(value = "SELECT d.* FROM condocompare.documentos d WHERE d.active = true ORDER BY d.created_at DESC LIMIT :limit", nativeQuery = true)
    List<Documento> findRecentActive(@Param("limit") int limit);
}
