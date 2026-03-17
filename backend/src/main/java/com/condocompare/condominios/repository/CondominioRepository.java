package com.condocompare.condominios.repository;

import com.condocompare.condominios.entity.Condominio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CondominioRepository extends JpaRepository<Condominio, UUID>, JpaSpecificationExecutor<Condominio> {

    Optional<Condominio> findByCnpjAndActiveTrue(String cnpj);

    boolean existsByCnpjAndActiveTrue(String cnpj);

    boolean existsByCnpjAndIdNotAndActiveTrue(String cnpj, UUID id);

    Page<Condominio> findAllByActiveTrue(Pageable pageable);

    // Busca por administradora
    Page<Condominio> findAllByAdministradoraIdAndActiveTrue(UUID administradoraId, Pageable pageable);

    // Busca por síndico
    Optional<Condominio> findBySindicoIdAndActiveTrue(UUID sindicoId);

    // Condominios com apólice vencendo nos próximos X dias
    @Query("SELECT c FROM Condominio c WHERE c.active = true AND c.vencimentoApolice BETWEEN :hoje AND :dataLimite ORDER BY c.vencimentoApolice ASC")
    List<Condominio> findCondominiosComApoliceVencendo(
        @Param("hoje") LocalDate hoje,
        @Param("dataLimite") LocalDate dataLimite
    );

    // Condominios com apólice vencida
    @Query("SELECT c FROM Condominio c WHERE c.active = true AND c.vencimentoApolice < :hoje ORDER BY c.vencimentoApolice ASC")
    List<Condominio> findCondominiosComApoliceVencida(@Param("hoje") LocalDate hoje);

    // Contagem por estado
    @Query("SELECT c.estado, COUNT(c) FROM Condominio c WHERE c.active = true GROUP BY c.estado")
    List<Object[]> countByEstado();

    // Contagem por tipo de construção
    @Query("SELECT c.tipoConstrucao, COUNT(c) FROM Condominio c WHERE c.active = true GROUP BY c.tipoConstrucao")
    List<Object[]> countByTipoConstrucao();

    // Busca textual (nome, cnpj, cidade)
    @Query("SELECT c FROM Condominio c WHERE c.active = true AND " +
           "(LOWER(c.nome) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "c.cnpj LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(c.cidade) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Condominio> searchByText(@Param("search") String search, Pageable pageable);

    long countByActiveTrue();

    @Query("SELECT c.id FROM Condominio c WHERE c.active = true AND c.administradoraId = :administradoraId")
    List<UUID> findIdsByAdministradoraId(@Param("administradoraId") UUID administradoraId);

    @Query("SELECT c.id FROM Condominio c WHERE c.active = true AND c.sindicoId = :sindicoId")
    List<UUID> findIdsBySindicoId(@Param("sindicoId") UUID sindicoId);

    @Query("SELECT c.seguradoraAtual, COUNT(c) FROM Condominio c WHERE c.active = true AND c.seguradoraAtual IS NOT NULL GROUP BY c.seguradoraAtual ORDER BY COUNT(c) DESC")
    List<Object[]> countBySeguradora();
}
