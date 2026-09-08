package com.civicos.core.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "official_documents")
@Data
public class OfficialDocument {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String citizenCnp;
    
    @Column(nullable = false)
    private String citizenName;

    @Column(nullable = false)
    private String documentType; // ex: Adeverinta Rol Fiscal, Certificat Urbanism

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, ISSUED, REJECTED

    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime issuedAt;

    @PrePersist
    protected void onCreate() {
        this.requestedAt = LocalDateTime.now();
    }
}
