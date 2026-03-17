package com.condocompare.vistorias.repository;

import com.condocompare.vistorias.entity.VistoriaFoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VistoriaFotoRepository extends JpaRepository<VistoriaFoto, UUID> {
    List<VistoriaFoto> findByVistoriaId(UUID vistoriaId);
    List<VistoriaFoto> findByVistoriaItemId(UUID vistoriaItemId);
    void deleteByVistoriaId(UUID vistoriaId);
}
