package net.javaguides.banking_app.repository;

import net.javaguides.banking_app.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanRepository extends JpaRepository<Loan, Long> {
}
