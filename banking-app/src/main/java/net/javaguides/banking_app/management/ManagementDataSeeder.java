package net.javaguides.banking_app.management;

import net.javaguides.banking_app.entity.AppUser;
import net.javaguides.banking_app.entity.SecurityEvent;
import net.javaguides.banking_app.entity.SecurityPolicy;
import net.javaguides.banking_app.entity.SystemSettings;
import net.javaguides.banking_app.repository.AppUserRepository;
import net.javaguides.banking_app.repository.SecurityPolicyRepository;
import net.javaguides.banking_app.repository.SystemSettingsRepository;
import net.javaguides.banking_app.service.SecurityEventLogger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/** Seeds one admin, default policy/settings, and a first audit entry on an empty database. */
@Component
public class ManagementDataSeeder implements CommandLineRunner {

    private final AppUserRepository users;
    private final SecurityPolicyRepository policies;
    private final SystemSettingsRepository settings;
    private final SecurityEventLogger audit;

    public ManagementDataSeeder(AppUserRepository users, SecurityPolicyRepository policies,
                                SystemSettingsRepository settings, SecurityEventLogger audit) {
        this.users = users;
        this.policies = policies;
        this.settings = settings;
        this.audit = audit;
    }

    @Override
    public void run(String... args) {
        if (users.count() == 0) {
            seedUser("Nkomo Ndumiso", "nkomondumiso43@gmail.com", AppUser.Role.ADMIN);
            seedUser("Thandi Mokoena", "thandi.mokoena@acme.example", AppUser.Role.MANAGER);
            seedUser("Pieter van Wyk", "pieter.vanwyk@acme.example", AppUser.Role.TELLER);
            seedUser("Lerato Dlamini", "lerato.dlamini@acme.example", AppUser.Role.AUDITOR);
            audit.log("SYSTEM_BOOT", SecurityEvent.Severity.INFO, "Management module initialised with default data.", "system");
        }
        if (!policies.existsById(SecurityPolicy.SINGLETON_ID)) policies.save(new SecurityPolicy());
        if (!settings.existsById(SystemSettings.SINGLETON_ID)) settings.save(new SystemSettings());
    }

    private void seedUser(String name, String email, AppUser.Role role) {
        AppUser u = new AppUser();
        u.setFullName(name);
        u.setEmail(email);
        u.setRole(role);
        users.save(u);
    }
}
