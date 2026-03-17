package com.condocompare.condominios.repository;

import com.condocompare.condominios.dto.CondominioFilter;
import com.condocompare.condominios.entity.Condominio;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CondominioSpecification {

    public static Specification<Condominio> withFilter(CondominioFilter filter, UUID administradoraId, UUID sindicoId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Sempre filtra por ativos
            predicates.add(cb.isTrue(root.get("active")));

            // Filtro por administradora (para perfil ADMINISTRADORA)
            if (administradoraId != null) {
                predicates.add(cb.equal(root.get("administradoraId"), administradoraId));
            }

            // Filtro por síndico (para perfil SINDICO)
            if (sindicoId != null) {
                predicates.add(cb.equal(root.get("sindicoId"), sindicoId));
            }

            if (filter != null) {
                // Busca textual
                if (StringUtils.hasText(filter.search())) {
                    String searchLower = "%" + filter.search().toLowerCase() + "%";
                    Predicate nomeLike = cb.like(cb.lower(root.get("nome")), searchLower);
                    Predicate cnpjLike = cb.like(root.get("cnpj"), "%" + filter.search() + "%");
                    Predicate cidadeLike = cb.like(cb.lower(root.get("cidade")), searchLower);
                    predicates.add(cb.or(nomeLike, cnpjLike, cidadeLike));
                }

                // Filtro por cidade
                if (StringUtils.hasText(filter.cidade())) {
                    predicates.add(cb.equal(cb.lower(root.get("cidade")), filter.cidade().toLowerCase()));
                }

                // Filtro por estado
                if (StringUtils.hasText(filter.estado())) {
                    predicates.add(cb.equal(cb.upper(root.get("estado")), filter.estado().toUpperCase()));
                }

                // Filtro por tipo de construção
                if (filter.tipoConstrucao() != null) {
                    predicates.add(cb.equal(root.get("tipoConstrucao"), filter.tipoConstrucao()));
                }

                // Filtro por seguradora
                if (StringUtils.hasText(filter.seguradora())) {
                    predicates.add(cb.like(cb.lower(root.get("seguradoraAtual")),
                        "%" + filter.seguradora().toLowerCase() + "%"));
                }

                // Filtro apólice vencendo (próximos 30 dias)
                if (Boolean.TRUE.equals(filter.apoliceVencendo())) {
                    LocalDate hoje = LocalDate.now();
                    LocalDate limite = hoje.plusDays(30);
                    predicates.add(cb.between(root.get("vencimentoApolice"), hoje, limite));
                }

                // Filtro apólice vencida
                if (Boolean.TRUE.equals(filter.apoliceVencida())) {
                    predicates.add(cb.lessThan(root.get("vencimentoApolice"), LocalDate.now()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
