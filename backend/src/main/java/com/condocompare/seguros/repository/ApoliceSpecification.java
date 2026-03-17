package com.condocompare.seguros.repository;

import com.condocompare.seguros.dto.ApoliceFilter;
import com.condocompare.seguros.entity.Apolice;
import com.condocompare.seguros.entity.StatusApolice;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;

public class ApoliceSpecification {

    public static Specification<Apolice> withFilter(ApoliceFilter filter) {
        return Specification
            .where(withSearch(filter.search()))
            .and(withCondominioId(filter.condominioId()))
            .and(withSeguradoraId(filter.seguradoraId()))
            .and(withStatus(filter.status()))
            .and(withVigente(filter.vigente()))
            .and(withVencendo(filter.vencendo(), filter.diasVencimento()))
            .and(withActive());
    }

    private static Specification<Apolice> withSearch(String search) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(search)) {
                return null;
            }
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("numeroApolice")), pattern),
                cb.like(cb.lower(root.join("condominio").get("nome")), pattern),
                cb.like(cb.lower(root.join("seguradora").get("nome")), pattern)
            );
        };
    }

    private static Specification<Apolice> withCondominioId(java.util.UUID condominioId) {
        return (root, query, cb) -> {
            if (condominioId == null) {
                return null;
            }
            return cb.equal(root.get("condominio").get("id"), condominioId);
        };
    }

    private static Specification<Apolice> withSeguradoraId(java.util.UUID seguradoraId) {
        return (root, query, cb) -> {
            if (seguradoraId == null) {
                return null;
            }
            return cb.equal(root.get("seguradora").get("id"), seguradoraId);
        };
    }

    private static Specification<Apolice> withStatus(StatusApolice status) {
        return (root, query, cb) -> {
            if (status == null) {
                return null;
            }
            return cb.equal(root.get("status"), status);
        };
    }

    private static Specification<Apolice> withVigente(Boolean vigente) {
        return (root, query, cb) -> {
            if (vigente == null || !vigente) {
                return null;
            }
            LocalDate hoje = LocalDate.now();
            return cb.and(
                cb.equal(root.get("status"), StatusApolice.VIGENTE),
                cb.lessThanOrEqualTo(root.get("dataInicio"), hoje),
                cb.greaterThanOrEqualTo(root.get("dataFim"), hoje)
            );
        };
    }

    private static Specification<Apolice> withVencendo(Boolean vencendo, Integer dias) {
        return (root, query, cb) -> {
            if (vencendo == null || !vencendo) {
                return null;
            }
            int diasVencimento = dias != null ? dias : 30;
            LocalDate hoje = LocalDate.now();
            LocalDate dataLimite = hoje.plusDays(diasVencimento);
            return cb.and(
                cb.equal(root.get("status"), StatusApolice.VIGENTE),
                cb.between(root.get("dataFim"), hoje, dataLimite)
            );
        };
    }

    private static Specification<Apolice> withActive() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }
}
