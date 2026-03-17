package com.condocompare.documentos.repository;

import com.condocompare.documentos.dto.DocumentoFilter;
import com.condocompare.documentos.entity.Documento;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class DocumentoSpecification {

    public static Specification<Documento> withFilter(DocumentoFilter filter, UUID administradoraCondominioId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Sempre filtra por ativos
            predicates.add(cb.isTrue(root.get("active")));

            // Filtro por condomínio específico
            if (filter != null && filter.condominioId() != null) {
                predicates.add(cb.equal(root.get("condominioId"), filter.condominioId()));
            }

            // Filtro por tipo
            if (filter != null && filter.tipo() != null) {
                predicates.add(cb.equal(root.get("tipo"), filter.tipo()));
            }

            // Filtro por status
            if (filter != null && filter.status() != null) {
                predicates.add(cb.equal(root.get("status"), filter.status()));
            }

            // Filtro por seguradora
            if (filter != null && StringUtils.hasText(filter.seguradora())) {
                predicates.add(cb.like(
                    cb.lower(root.get("seguradoraNome")),
                    "%" + filter.seguradora().toLowerCase() + "%"
                ));
            }

            // Busca textual
            if (filter != null && StringUtils.hasText(filter.search())) {
                String searchLower = "%" + filter.search().toLowerCase() + "%";
                Predicate nomeLike = cb.like(cb.lower(root.get("nome")), searchLower);
                Predicate arquivoLike = cb.like(cb.lower(root.get("nomeArquivo")), searchLower);
                Predicate seguradoraLike = cb.like(cb.lower(root.get("seguradoraNome")), searchLower);
                predicates.add(cb.or(nomeLike, arquivoLike, seguradoraLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
