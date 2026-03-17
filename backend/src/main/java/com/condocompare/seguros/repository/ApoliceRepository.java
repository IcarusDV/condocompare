package com.condocompare.seguros.repository;

import com.condocompare.seguros.entity.Apolice;
import com.condocompare.seguros.entity.StatusApolice;
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
public interface ApoliceRepository extends JpaRepository<Apolice, UUID>, JpaSpecificationExecutor<Apolice> {

    Optional<Apolice> findByNumeroApolice(String numeroApolice);

    List<Apolice> findByCondominioIdAndActiveTrue(UUID condominioId);

    List<Apolice> findByCondominioIdAndStatusAndActiveTrue(UUID condominioId, StatusApolice status);

    List<Apolice> findBySeguradoraIdAndActiveTrue(UUID seguradoraId);

    @Query("SELECT a FROM Apolice a WHERE a.active = true AND a.status = 'VIGENTE' AND a.dataFim <= :dataLimite")
    List<Apolice> findVencendo(@Param("dataLimite") LocalDate dataLimite);

    @Query("SELECT a FROM Apolice a WHERE a.active = true AND a.status = 'VIGENTE' AND a.dataFim < :hoje")
    List<Apolice> findVencidas(@Param("hoje") LocalDate hoje);

    @Query("SELECT a FROM Apolice a WHERE a.condominio.id = :condominioId AND a.active = true AND a.status = 'VIGENTE' ORDER BY a.dataFim DESC")
    Optional<Apolice> findApoliceVigenteByCondominio(@Param("condominioId") UUID condominioId);

    @Query("SELECT COUNT(a) FROM Apolice a WHERE a.active = true AND a.status = 'VIGENTE'")
    long countVigentes();

    @Query("SELECT COUNT(a) FROM Apolice a WHERE a.active = true AND a.status = 'VIGENTE' AND a.dataFim BETWEEN :hoje AND :dataLimite")
    long countVencendoEmDias(@Param("hoje") LocalDate hoje, @Param("dataLimite") LocalDate dataLimite);
}
