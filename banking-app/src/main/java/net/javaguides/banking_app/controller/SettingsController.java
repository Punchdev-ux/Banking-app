package net.javaguides.banking_app.controller;

import jakarta.validation.Valid;
import net.javaguides.banking_app.entity.SecurityEvent;
import net.javaguides.banking_app.entity.SystemSettings;
import net.javaguides.banking_app.repository.SystemSettingsRepository;
import net.javaguides.banking_app.service.SecurityEventLogger;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.Currency;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SystemSettingsRepository settings;
    private final SecurityEventLogger audit;

    public SettingsController(SystemSettingsRepository settings, SecurityEventLogger audit) {
        this.settings = settings;
        this.audit = audit;
    }

    @GetMapping
    public SystemSettings get() {
        return settings.findById(SystemSettings.SINGLETON_ID)
                .orElseGet(() -> settings.save(new SystemSettings()));
    }

    @PutMapping
    @Transactional
    public SystemSettings update(@Valid @RequestBody SystemSettings incoming,
                                 @RequestHeader(value = "X-Admin-User", required = false) String actor) {
        String currency = incoming.getCurrency().trim().toUpperCase();
        try {
            Currency.getInstance(currency);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown currency code: " + currency + ".");
        }

        String tz = incoming.getTimezone().trim();
        try {
            ZoneId.of(tz);
        } catch (DateTimeException ex) {
            throw new IllegalArgumentException("Unknown timezone: " + tz + ".");
        }

        if (incoming.getMaxLoanAmount() != null && incoming.getDailyTransferLimit() != null
                && incoming.getMaxLoanAmount().signum() == 0) {
            throw new IllegalArgumentException("Maximum loan amount must be greater than zero.");
        }

        SystemSettings current = get();
        boolean maintenanceChanged = current.isMaintenanceMode() != incoming.isMaintenanceMode();

        current.setInstitutionName(incoming.getInstitutionName().trim());
        current.setCurrency(currency);
        current.setTimezone(tz);
        current.setDailyTransferLimit(incoming.getDailyTransferLimit());
        current.setMaxLoanAmount(incoming.getMaxLoanAmount());
        current.setLoanInterestRate(incoming.getLoanInterestRate());
        current.setEmailNotifications(incoming.isEmailNotifications());
        current.setMaintenanceMode(incoming.isMaintenanceMode());

        SystemSettings saved = settings.save(current);

        audit.log("SETTINGS_UPDATED", SecurityEvent.Severity.INFO, "System settings were updated.", actor);
        if (maintenanceChanged) {
            audit.log("MAINTENANCE_MODE", SecurityEvent.Severity.WARNING,
                    "Maintenance mode " + (saved.isMaintenanceMode() ? "enabled" : "disabled") + ".", actor);
        }
        return saved;
    }
}