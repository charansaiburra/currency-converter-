package com.currencyconverter.service;

import com.currencyconverter.model.ExchangeRateResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CurrencyService {

    private final RestTemplate restTemplate;

    @Value("${exchangerate.api.url}")
    private String apiUrl;

    // Thread-safe in-memory cache
    private final Map<String, CachedRates> cache = new ConcurrentHashMap<>();

    // Map of currency codes to user-friendly names
    private static final Map<String, String> CURRENCY_NAMES;

    static {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("USD", "United States Dollar");
        map.put("EUR", "Euro");
        map.put("INR", "Indian Rupee");
        map.put("GBP", "British Pound");
        map.put("JPY", "Japanese Yen");
        map.put("AUD", "Australian Dollar");
        map.put("CAD", "Canadian Dollar");
        map.put("CHF", "Swiss Franc");
        map.put("CNY", "Chinese Yuan");
        map.put("NZD", "New Zealand Dollar");
        map.put("SGD", "Singapore Dollar");
        map.put("AED", "UAE Dirham");
        map.put("ZAR", "South African Rand");
        map.put("SAR", "Saudi Riyal");
        map.put("RUB", "Russian Ruble");
        map.put("BRL", "Brazilian Real");
        map.put("KRW", "South Korean Won");
        map.put("MXN", "Mexican Peso");
        map.put("TRY", "Turkish Lira");
        map.put("HKD", "Hong Kong Dollar");
        map.put("SEK", "Swedish Krona");
        map.put("NOK", "Norwegian Krone");
        map.put("DKK", "Danish Krone");
        map.put("PLN", "Polish Zloty");
        map.put("THB", "Thai Baht");
        map.put("IDR", "Indonesian Rupiah");
        map.put("MYR", "Malaysian Ringgit");
        map.put("PHP", "Philippine Peso");
        CURRENCY_NAMES = Collections.unmodifiableMap(map);
    }

    public CurrencyService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, String> getSupportedCurrencies() {
        return CURRENCY_NAMES;
    }

    public ExchangeRateResponse getLatestRates(String baseCurrency) {
        String base = baseCurrency.toUpperCase();
        CachedRates cached = cache.get(base);

        if (cached != null && !cached.isExpired()) {
            return cached.getResponse();
        }

        try {
            String url = apiUrl + "/" + base;
            ExchangeRateResponse response = restTemplate.getForObject(url, ExchangeRateResponse.class);
            if (response != null && "success".equalsIgnoreCase(response.getResult())) {
                cache.put(base, new CachedRates(response));
                return response;
            } else {
                throw new RuntimeException("Failed to fetch exchange rates from provider");
            }
        } catch (Exception e) {
            // If API fetch fails but we have an expired cache, return the expired cache as fallback
            if (cached != null) {
                return cached.getResponse();
            }
            throw new RuntimeException("Exchange rate service is currently unavailable: " + e.getMessage(), e);
        }
    }

    public Double getExchangeRate(String from, String to) {
        ExchangeRateResponse response = getLatestRates(from);
        if (response.getRates() != null && response.getRates().containsKey(to.toUpperCase())) {
            return response.getRates().get(to.toUpperCase());
        }
        throw new IllegalArgumentException("Unsupported or invalid currency code: " + to);
    }

    // Helper static class for in-memory caching
    private static class CachedRates {
        private final ExchangeRateResponse response;
        private final LocalDateTime fetchTime;

        public CachedRates(ExchangeRateResponse response) {
            this.response = response;
            this.fetchTime = LocalDateTime.now();
        }

        public boolean isExpired() {
            return LocalDateTime.now().isAfter(fetchTime.plusHours(1));
        }

        public ExchangeRateResponse getResponse() {
            return response;
        }
    }
}
