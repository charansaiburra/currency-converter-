package com.currencyconverter.controller;

import com.currencyconverter.model.ConversionHistory;
import com.currencyconverter.model.User;
import com.currencyconverter.service.CurrencyService;
import com.currencyconverter.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class CurrencyController {

    private final CurrencyService currencyService;
    private final HistoryService historyService;

    public CurrencyController(CurrencyService currencyService, HistoryService historyService) {
        this.currencyService = currencyService;
        this.historyService = historyService;
    }

    @GetMapping("/currencies")
    public ResponseEntity<Map<String, String>> getCurrencies() {
        return ResponseEntity.ok(currencyService.getSupportedCurrencies());
    }

    @GetMapping("/rates")
    public ResponseEntity<?> getRates(@RequestParam(defaultValue = "USD") String base) {
        try {
            return ResponseEntity.ok(currencyService.getLatestRates(base));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/convert")
    public ResponseEntity<?> convertCurrency(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam Double amount) {

        if (from == null || from.trim().isEmpty() || to == null || to.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Source and target currency codes are required"));
        }
        if (amount == null || amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Amount must be a positive number"));
        }

        try {
            // Retrieve the authenticated User from Security Context
            User authenticatedUser = (User) SecurityContextHolder.getContext()
                    .getAuthentication()
                    .getPrincipal();

            // Fetch latest rate and calculate
            Double rate = currencyService.getExchangeRate(from, to);
            Double convertedAmount = amount * rate;

            // Round to 4 decimal places for precision display
            convertedAmount = Math.round(convertedAmount * 10000.0) / 10000.0;

            // Save record in history
            ConversionHistory historyRecord = historyService.saveRecord(
                    authenticatedUser, from, to, amount, convertedAmount, rate);

            // Return custom details
            return ResponseEntity.ok(Map.of(
                    "id", historyRecord.getId(),
                    "from", from.toUpperCase(),
                    "to", to.toUpperCase(),
                    "amount", amount,
                    "rate", rate,
                    "convertedAmount", convertedAmount,
                    "timestamp", historyRecord.getTimestamp()
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
