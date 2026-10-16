package com.civicos.core.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "official_documents")
@Data
@lombok.EqualsAndHashCode(callSuper=true)
public class OfficialDocument extends Auditable {

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

    private String registrationNumber;
    private String purpose;
    private LocalDate validUntil;
    private String qrVerificationCode;

    @PrePersist
    protected void onCreate() {
        if (this.registrationNumber == null) {
            this.registrationNumber = "REG-" + java.time.Year.now().getValue() + "-" + String.format("%05d", (int)(Math.random() * 99999));
        }
        if (this.qrVerificationCode == null) {
            this.qrVerificationCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }

    @JsonProperty("issueDate")
    public LocalDateTime getIssueDate() {
        return this.issuedAt;
    }
}
