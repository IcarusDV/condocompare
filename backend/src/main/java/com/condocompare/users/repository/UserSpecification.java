package com.condocompare.users.repository;

import com.condocompare.users.dto.UserFilter;
import com.condocompare.users.entity.User;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public class UserSpecification {

    public static Specification<User> withFilter(UserFilter filter) {
        return Specification
            .where(withSearch(filter.search()))
            .and(withRole(filter.role()))
            .and(withEmailVerified(filter.emailVerified()))
            .and(withActive(filter.active()));
    }

    private static Specification<User> withSearch(String search) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(search)) {
                return null;
            }
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("name")), pattern),
                cb.like(cb.lower(root.get("email")), pattern),
                cb.like(cb.lower(root.get("organizationName")), pattern)
            );
        };
    }

    private static Specification<User> withRole(com.condocompare.users.entity.Role role) {
        return (root, query, cb) -> {
            if (role == null) {
                return null;
            }
            return cb.equal(root.get("role"), role);
        };
    }

    private static Specification<User> withEmailVerified(Boolean emailVerified) {
        return (root, query, cb) -> {
            if (emailVerified == null) {
                return null;
            }
            return cb.equal(root.get("emailVerified"), emailVerified);
        };
    }

    private static Specification<User> withActive(Boolean active) {
        return (root, query, cb) -> {
            if (active == null) {
                return cb.isTrue(root.get("active"));
            }
            return cb.equal(root.get("active"), active);
        };
    }
}
