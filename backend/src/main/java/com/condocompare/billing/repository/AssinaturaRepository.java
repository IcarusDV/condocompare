package com.condocompare.billing.repository;

import com.condocompare.billing.entity.Assinatura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssinaturaRepository extends JpaRepository<Assinatura, UUID> {
    Optional<Assinatura> findByUserIdAndStatus(UUID userId, String status);
    List<Assinatura> findByUserId(UUID userId);
    List<Assinatura> findByStatus(String status);
}
