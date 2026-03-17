package com.condocompare.seguros.repository;

import com.condocompare.seguros.entity.Cobertura;
import com.condocompare.seguros.entity.TipoCobertura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CoberturaRepository extends JpaRepository<Cobertura, UUID> {

    List<Cobertura> findByApoliceId(UUID apoliceId);

    List<Cobertura> findByApoliceIdAndContratadaTrue(UUID apoliceId);

    List<Cobertura> findByApoliceIdAndTipo(UUID apoliceId, TipoCobertura tipo);

    void deleteByApoliceId(UUID apoliceId);
}
