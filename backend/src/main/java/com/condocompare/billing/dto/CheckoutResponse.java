package com.condocompare.billing.dto;

public record CheckoutResponse(
    String checkoutUrl,
    boolean stripeEnabled
) {}
