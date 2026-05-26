package com.currencyconverter.controller;

import com.currencyconverter.model.ConversionHistory;
import com.currencyconverter.model.User;
import com.currencyconverter.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping("/history")
    public ResponseEntity<List<ConversionHistory>> getHistory() {
        // Retrieve the authenticated User from Security Context
        User authenticatedUser = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        List<ConversionHistory> history = historyService.getHistoryForUser(authenticatedUser);
        return ResponseEntity.ok(history);
    }
}
