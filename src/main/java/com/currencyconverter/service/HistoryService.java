package com.currencyconverter.service;

import com.currencyconverter.model.ConversionHistory;
import com.currencyconverter.model.User;
import com.currencyconverter.repository.HistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HistoryService {

    private final HistoryRepository historyRepository;

    public HistoryService(HistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    @Transactional
    public ConversionHistory saveRecord(User user, String from, String to, Double amount, Double convertedAmount, Double rate) {
        ConversionHistory history = ConversionHistory.builder()
                .user(user)
                .fromCurrency(from.toUpperCase())
                .toCurrency(to.toUpperCase())
                .amount(amount)
                .convertedAmount(convertedAmount)
                .exchangeRate(rate)
                .build();
                
        return historyRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<ConversionHistory> getHistoryForUser(User user) {
        return historyRepository.findByUserOrderByTimestampDesc(user);
    }
}
