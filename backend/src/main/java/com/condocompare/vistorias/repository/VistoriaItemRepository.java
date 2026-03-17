package com.condocompare.vistorias.repository;

import com.condocompare.vistorias.entity.VistoriaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VistoriaItemRepository extends JpaRepository<VistoriaItem, UUID> {
    List<VistoriaItem> findByVistoriaIdOrderByOrdem(UUID vistoriaId);
    long countByVistoriaIdAndStatus(UUID vistoriaId, String status);
    void deleteByVistoriaId(UUID vistoriaId);
}
