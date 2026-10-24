package net.javaguides.banking_app.dto;

import com.fasterxml.jackson.annotation.JsonFormat; // ◄ ADD THIS IMPORT
import java.time.LocalDateTime;

public record TransactionDto(
        Long id,
        Long accountId,
        double amount,
        String transactionType,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") // ◄ ADD THIS CONSTRAINT FORMAT
        LocalDateTime timestamp,

        String details
) {}
