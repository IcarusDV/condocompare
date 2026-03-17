package com.condocompare.ia.client;

import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;

@Slf4j
public class CircuitBreaker {

    enum State { CLOSED, OPEN, HALF_OPEN }

    private final String name;
    private final int failureThreshold;
    private final long resetTimeoutMs;
    private final AtomicReference<State> state = new AtomicReference<>(State.CLOSED);
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private volatile Instant lastFailureTime = Instant.MIN;

    public CircuitBreaker(String name, int failureThreshold, long resetTimeoutMs) {
        this.name = name;
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
    }

    public <T> T execute(Supplier<T> action, Supplier<T> fallback) {
        if (!allowRequest()) {
            log.warn("Circuit breaker [{}] is OPEN - returning fallback", name);
            return fallback.get();
        }

        try {
            T result = action.get();
            onSuccess();
            return result;
        } catch (Exception e) {
            onFailure();
            log.warn("Circuit breaker [{}] recorded failure ({}/{}): {}",
                name, failureCount.get(), failureThreshold, e.getMessage());
            throw e;
        }
    }

    private boolean allowRequest() {
        State current = state.get();
        if (current == State.CLOSED) {
            return true;
        }
        if (current == State.OPEN) {
            if (Instant.now().toEpochMilli() - lastFailureTime.toEpochMilli() > resetTimeoutMs) {
                if (state.compareAndSet(State.OPEN, State.HALF_OPEN)) {
                    log.info("Circuit breaker [{}] transitioning to HALF_OPEN", name);
                }
                return true;
            }
            return false;
        }
        // HALF_OPEN - allow one request
        return true;
    }

    private void onSuccess() {
        if (state.get() == State.HALF_OPEN) {
            state.set(State.CLOSED);
            failureCount.set(0);
            log.info("Circuit breaker [{}] recovered - now CLOSED", name);
        } else {
            failureCount.set(0);
        }
    }

    private void onFailure() {
        lastFailureTime = Instant.now();
        int failures = failureCount.incrementAndGet();
        if (failures >= failureThreshold || state.get() == State.HALF_OPEN) {
            state.set(State.OPEN);
            log.warn("Circuit breaker [{}] tripped to OPEN after {} failures", name, failures);
        }
    }

    public boolean isOpen() {
        return state.get() == State.OPEN;
    }
}
