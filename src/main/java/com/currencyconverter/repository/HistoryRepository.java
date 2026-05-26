package com.currencyconverter.repository;

import com.currencyconverter.model.ConversionHistory;
import com.currencyconverter.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryRepository extends JpaRepository<ConversionHistory, Long> {
    List<ConversionHistory> findByUserOrderByTimestampDesc(User user);
}
