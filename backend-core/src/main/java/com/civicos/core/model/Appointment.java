package com.civicos.core.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "appointments")
@Data
public class Appointment {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 13)
    private String citizenCnp;

    @Column(nullable = false, length = 150)
    private String citizenName;

    @Column(nullable = false, length = 10)
    private String appointmentDate; // YYYY-MM-DD

    @Column(nullable = false, length = 10)
    private String timeSlot; // HH:MM

    @Column(length = 300)
    private String purpose;

    // CONFIRMED, CANCELLED
    @Column(nullable = false, length = 20)
    private String status = "CONFIRMED";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
