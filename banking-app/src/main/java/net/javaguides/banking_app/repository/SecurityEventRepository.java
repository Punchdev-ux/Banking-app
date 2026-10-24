package net.javaguides.banking_app.repository;

import net.javaguides.banking_app.entity.SecurityEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {

    List<SecurityEvent> findAllByOrderByTimestampDesc(Pageable pageable);

    long countBySeverity(SecurityEvent.Severity severity);
}
