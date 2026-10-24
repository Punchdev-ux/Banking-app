package net.javaguides.banking_app.controller;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import net.javaguides.banking_app.entity.AppUser;
import net.javaguides.banking_app.entity.SecurityEvent;
import net.javaguides.banking_app.repository.AppUserRepository;
import net.javaguides.banking_app.service.SecurityEventLogger;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record UserRequest(
            @NotBlank(message = "Full name is required.")
            @Size(max = 120, message = "Full name is too long.")
            String fullName,

            @NotBlank(message = "Email is required.")
            @Email(message = "Enter a valid email address.")
            @Size(max = 160, message = "Email is too long.")
            String email,

            @NotNull(message = "Role is required.")
            AppUser.Role role) {
    }

    private final AppUserRepository users;
    private final SecurityEventLogger audit;

    public UserController(AppUserRepository users, SecurityEventLogger audit) {
        this.users = users;
        this.audit = audit;
    }

    @GetMapping
    public List<AppUser> list() {
        return users.findAll(Sort.by(Sort.Direction.ASC, "id"));
    }

    @GetMapping("/{id}")
    public AppUser get(@PathVariable Long id) {
        return users.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AppUser create(@Valid @RequestBody UserRequest req,
                          @RequestHeader(value = "X-Admin-User", required = false) String actor) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw new IllegalStateException("A user with that email already exists.");
        }

        AppUser u = new AppUser();
        u.setFullName(req.fullName().trim());
        u.setEmail(email);
        u.setRole(req.role());
        u.setStatus(AppUser.Status.ACTIVE);

        AppUser saved = users.save(u);
        audit.log("USER_CREATED", SecurityEvent.Severity.INFO,
                "User " + saved.getEmail() + " created with role " + saved.getRole() + ".", actor);
        return saved;
    }

    @PutMapping("/{id}")
    @Transactional
    public AppUser update(@PathVariable Long id,
                          @Valid @RequestBody UserRequest req,
                          @RequestHeader(value = "X-Admin-User", required = false) String actor) {
        AppUser u = get(id);
        String email = req.email().trim().toLowerCase();

        if (users.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new IllegalStateException("A user with that email already exists.");
        }
        if (u.getRole() == AppUser.Role.ADMIN && req.role() != AppUser.Role.ADMIN) {
            guardLastActiveAdmin(u, "change the role of");
        }

        AppUser.Role oldRole = u.getRole();
        u.setFullName(req.fullName().trim());
        u.setEmail(email);
        u.setRole(req.role());

        AppUser saved = users.save(u);
        audit.log("USER_UPDATED", oldRole == saved.getRole() ? SecurityEvent.Severity.INFO : SecurityEvent.Severity.WARNING,
                "User " + saved.getEmail() + " updated (role " + oldRole + " -> " + saved.getRole() + ").", actor);
        return saved;
    }

    /** Body: {"status": "ACTIVE" | "SUSPENDED"} */
    @PatchMapping("/{id}/status")
    @Transactional
    public AppUser setStatus(@PathVariable Long id,
                             @RequestBody Map<String, String> body,
                             @RequestHeader(value = "X-Admin-User", required = false) String actor) {
        AppUser.Status status;
        try {
            status = AppUser.Status.valueOf(String.valueOf(body.get("status")).toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Status must be ACTIVE or SUSPENDED.");
        }

        AppUser u = get(id);
        if (status == AppUser.Status.SUSPENDED && u.getRole() == AppUser.Role.ADMIN) {
            guardLastActiveAdmin(u, "suspend");
        }

        u.setStatus(status);
        AppUser saved = users.save(u);

        audit.log("USER_STATUS_CHANGED",
                status == AppUser.Status.SUSPENDED ? SecurityEvent.Severity.WARNING : SecurityEvent.Severity.INFO,
                "User " + saved.getEmail() + " set to " + status + ".", actor);
        return saved;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id,
                       @RequestHeader(value = "X-Admin-User", required = false) String actor) {
        AppUser u = get(id);
        if (u.getRole() == AppUser.Role.ADMIN) {
            guardLastActiveAdmin(u, "remove");
        }

        users.delete(u);
        audit.log("USER_DELETED", SecurityEvent.Severity.WARNING,
                "User " + u.getEmail() + " removed.", actor);
    }

    /** Never allow the console to be left without an active administrator. */
    private void guardLastActiveAdmin(AppUser target, String verb) {
        boolean targetIsActiveAdmin = target.getStatus() == AppUser.Status.ACTIVE;
        long activeAdmins = users.countByRoleAndStatus(AppUser.Role.ADMIN, AppUser.Status.ACTIVE);

        if (targetIsActiveAdmin && activeAdmins <= 1) {
            throw new IllegalStateException("Cannot " + verb + " the last active administrator.");
        }
    }
}