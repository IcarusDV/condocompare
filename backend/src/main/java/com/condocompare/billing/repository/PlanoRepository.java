package com.condocompare.billing.repository;

import com.condocompare.billing.entity.Plano;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanoRepository extends JpaRepository<Plano, UUID> {
    List<Plano> findByAtivoTrueOrderByOrdem();
    Optional<Plano> findByCodigo(String codigo);
}
