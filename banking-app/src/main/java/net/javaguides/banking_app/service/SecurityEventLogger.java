package net.javaguides.banking_app.service;

import net.javaguides.banking_app.entity.SecurityEvent;
import net.javaguides.banking_app.repository.SecurityEventRepository;
import org.springframework.stereotype.Service;

/** Small helper so every management action leaves an audit entry. */
@Service
public class SecurityEventLogger {

    private final SecurityEventRepository events;

    public SecurityEventLogger(SecurityEventRepository events) {
        this.events = events;
    }

    public void log(String type, SecurityEvent.Severity severity, String description, String actor) {
        events.save(new SecurityEvent(type, severity, description, actor == null || actor.isBlank() ? "system" : actor));
    }
}
