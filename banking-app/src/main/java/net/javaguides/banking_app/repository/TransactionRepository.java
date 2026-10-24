package net.javaguides.banking_app.repository;

import net.javaguides.banking_app.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    // Fetches all audit trails for a specific account sorted by latest first
    List<Transaction> findByAccountIdOrderByTimestampDesc(Long accountId);
}
