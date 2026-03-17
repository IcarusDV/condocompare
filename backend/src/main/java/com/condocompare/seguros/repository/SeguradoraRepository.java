package com.condocompare.seguros.repository;

import com.condocompare.seguros.entity.Seguradora;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SeguradoraRepository extends JpaRepository<Seguradora, UUID> {

    Optional<Seguradora> findByCnpj(String cnpj);

    boolean existsByCnpj(String cnpj);

    List<Seguradora> findByActiveTrue();

    List<Seguradora> findByNomeContainingIgnoreCaseAndActiveTrue(String nome);
}
