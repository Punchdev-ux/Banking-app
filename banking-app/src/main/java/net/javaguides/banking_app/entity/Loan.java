package net.javaguides.banking_app.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "loans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double loanAmount;
    private double interestRate;
    private String status; // e.g., "APPROVED", "PENDING", "REJECTED"

    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account; // Links the loan debt record back to a banking profile
}

