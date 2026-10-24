package net.javaguides.banking_app.entity;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Append-only security audit entry (policy changes, user changes, lockouts). */
@Entity
@Table(name = "security_events")
@Getter
@Setter
@NoArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class SecurityEvent {

    public enum Severity { INFO, WARNING, CRITICAL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity = Severity.INFO;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(length = 120)
    private String actor;

    private LocalDateTime timestamp;

    @PrePersist
    void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }

    public SecurityEvent(String eventType, Severity severity, String description, String actor) {
        this.eventType = eventType;
        this.severity = severity;
        this.description = description;
        this.actor = actor;
    }
}
