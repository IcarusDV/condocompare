package com.condocompare.seguros.repository;

import com.condocompare.seguros.entity.Cobertura;
import com.condocompare.seguros.entity.TipoCobertura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CoberturaRepository extends JpaRepository<Cobertura, UUID> {

    List<Cobertura> findByApoliceIdAndActiveTrue(UUID apoliceId);

    List<Cobertura> findByApoliceIdAndContratadaTrueAndActiveTrue(UUID apoliceId);

    List<Cobertura> findByApoliceIdAndTipoAndActiveTrue(UUID apoliceId, TipoCobertura tipo);

    void deleteByApoliceId(UUID apoliceId);
}
