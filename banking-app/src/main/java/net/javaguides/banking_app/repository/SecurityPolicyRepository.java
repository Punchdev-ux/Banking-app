package net.javaguides.banking_app.repository;

import net.javaguides.banking_app.entity.SecurityPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SecurityPolicyRepository extends JpaRepository<SecurityPolicy, Long> {
}
