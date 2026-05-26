package com.currencyconverter.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversion_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "from_currency", nullable = false)
    private String fromCurrency;

    @Column(name = "to_currency", nullable = false)
    private String toCurrency;

    @Column(nullable = false)
    private Double amount;

    @Column(name = "converted_amount", nullable = false)
    private Double convertedAmount;

    @Column(name = "exchange_rate", nullable = false)
    private Double exchangeRate;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}
