package net.javaguides.banking_app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import net.javaguides.banking_app.entity.AppUser;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    long countByRoleAndStatus(AppUser.Role role, AppUser.Status status);
}
