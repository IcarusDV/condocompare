package com.condocompare.common.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Simple in-memory rate limiting filter.
 * Limits requests per IP to prevent abuse.
 * For production with multiple instances, replace with Redis-based rate limiting.
 */
@Component
@Order(1)
public class RateLimitFilter implements Filter {

    private static final int MAX_REQUESTS_PER_MINUTE = 120;
    // Limite mais restrito para endpoints de autenticação (anti brute-force)
    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 10;
    private static final long WINDOW_MS = 60_000L;

    private final Map<String, RateBucket> buckets = new ConcurrentHashMap<>();
    private final Map<String, RateBucket> authBuckets = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Skip rate limiting for health checks
        String path = httpRequest.getRequestURI();
        if (path.contains("/actuator/health")) {
            chain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(httpRequest);

        // Limite adicional mais restrito para endpoints de autenticação
        boolean isAuthEndpoint = path.startsWith("/v1/auth/login")
            || path.startsWith("/v1/auth/register")
            || path.startsWith("/v1/auth/forgot-password")
            || path.startsWith("/v1/auth/reset-password");

        if (isAuthEndpoint) {
            RateBucket authBucket = authBuckets.computeIfAbsent(clientIp, k -> new RateBucket(MAX_AUTH_REQUESTS_PER_MINUTE));
            if (!authBucket.tryConsume()) {
                writeRateLimitResponse(httpResponse, "Muitas tentativas de autenticação. Aguarde um momento.");
                return;
            }
        }

        RateBucket bucket = buckets.computeIfAbsent(clientIp, k -> new RateBucket(MAX_REQUESTS_PER_MINUTE));

        if (!bucket.tryConsume()) {
            writeRateLimitResponse(httpResponse, "Muitas requisições. Tente novamente em instantes.");
            return;
        }

        chain.doFilter(request, response);
    }

    private void writeRateLimitResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"status\":429,\"message\":\"" + message + "\"}");
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RateBucket {
        private final AtomicInteger count = new AtomicInteger(0);
        private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());
        private final int limit;

        RateBucket(int limit) {
            this.limit = limit;
        }

        boolean tryConsume() {
            long now = System.currentTimeMillis();
            long start = windowStart.get();

            if (now - start > WINDOW_MS) {
                windowStart.set(now);
                count.set(1);
                return true;
            }

            return count.incrementAndGet() <= limit;
        }
    }
}
