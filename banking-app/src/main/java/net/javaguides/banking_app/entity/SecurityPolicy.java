package net.javaguides.banking_app.entity;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Single-row table holding the console's security policy. Row id is always 1. */
@Entity
@Table(name = "security_policy")
@Getter
@Setter
@NoArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class SecurityPolicy {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @Min(8) @Max(64)
    private int minPasswordLength = 12;

    private boolean requireMfa = true;

    @Min(5) @Max(480)
    private int sessionTimeoutMinutes = 30;

    @Min(3) @Max(20)
    private int maxFailedLogins = 5;

    @Min(1) @Max(1440)
    private int lockoutMinutes = 15;

    private boolean ipAllowlistEnabled = false;

    @Column(length = 1000)
    private String ipAllowlist = "";

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }
}
