package net.javaguides.banking_app.controller;

import jakarta.validation.Valid;
import net.javaguides.banking_app.entity.SecurityEvent;
import net.javaguides.banking_app.entity.SecurityPolicy;
import net.javaguides.banking_app.repository.SecurityEventRepository;
import net.javaguides.banking_app.repository.SecurityPolicyRepository;
import net.javaguides.banking_app.service.SecurityEventLogger;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security")
public class SecurityController {

    private final SecurityPolicyRepository policies;
    private final SecurityEventRepository events;
    private final SecurityEventLogger audit;

    public SecurityController(SecurityPolicyRepository policies,
                              SecurityEventRepository events,
                              SecurityEventLogger audit) {
        this.policies = policies;
        this.events = events;
        this.audit = audit;
    }

    @GetMapping("/policy")
    public SecurityPolicy getPolicy() {
        return policies.findById(SecurityPolicy.SINGLETON_ID)
                .orElseGet(() -> policies.save(new SecurityPolicy()));
    }

    @PutMapping("/policy")
    @Transactional
    public SecurityPolicy updatePolicy(@Valid @RequestBody SecurityPolicy incoming,
                                       @RequestHeader(value = "X-Admin-User", required = false) String actor) {
        if (incoming.isIpAllowlistEnabled()
                && (incoming.getIpAllowlist() == null || incoming.getIpAllowlist().isBlank())) {
            throw new IllegalArgumentException("Provide at least one IP address before enabling the allowlist.");
        }

        SecurityPolicy current = getPolicy();
        current.setMinPasswordLength(incoming.getMinPasswordLength());
        current.setRequireMfa(incoming.isRequireMfa());
        current.setSessionTimeoutMinutes(incoming.getSessionTimeoutMinutes());
        current.setMaxFailedLogins(incoming.getMaxFailedLogins());
        current.setLockoutMinutes(incoming.getLockoutMinutes());
        current.setIpAllowlistEnabled(incoming.isIpAllowlistEnabled());
        current.setIpAllowlist(incoming.getIpAllowlist() == null ? "" : incoming.getIpAllowlist().trim());

        SecurityPolicy saved = policies.save(current);
        audit.log("POLICY_UPDATED", SecurityEvent.Severity.WARNING, "Security policy was updated.", actor);
        return saved;
    }

    /** Most recent events first. ?limit= defaults to 50, capped at 200. */
    @GetMapping("/events")
    public List<SecurityEvent> recentEvents(@RequestParam(defaultValue = "50") int limit) {
        int size = Math.max(1, Math.min(limit, 200));
        return events.findAllByOrderByTimestampDesc(PageRequest.of(0, size));
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("info_events", events.countBySeverity(SecurityEvent.Severity.INFO));
        out.put("warning_events", events.countBySeverity(SecurityEvent.Severity.WARNING));
        out.put("critical_events", events.countBySeverity(SecurityEvent.Severity.CRITICAL));
        return out;
    }
}