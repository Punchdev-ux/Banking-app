package net.javaguides.banking_app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor

@Builder
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id")
    private Long accountId;
    private double amount;
    @Column(name = "transaction_type")
    private String transactionType; // e.g., "DEPOSIT", "WITHDRAWAL", "TRANSFER_OUT", "TRANSFER_IN", "LOAN"
    private LocalDateTime timestamp;
    private String details;
}
