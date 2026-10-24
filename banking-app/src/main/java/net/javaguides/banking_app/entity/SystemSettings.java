package net.javaguides.banking_app.entity;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Single-row table of operational settings. Row id is always 1. */
@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class SystemSettings {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @NotBlank @Size(max = 120)
    private String institutionName = "ACME Bank";

    @NotBlank @Size(min = 3, max = 3)
    private String currency = "ZAR";

    @NotBlank @Size(max = 60)
    private String timezone = "Africa/Johannesburg";

    @DecimalMin("0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal dailyTransferLimit = new BigDecimal("250000.00");

    @DecimalMin("0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal maxLoanAmount = new BigDecimal("500000.00");

    @DecimalMin("0.00")
    @Column(precision = 5, scale = 2)
    private BigDecimal loanInterestRate = new BigDecimal("11.75");

    private boolean emailNotifications = true;

    private boolean maintenanceMode = false;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }
}
