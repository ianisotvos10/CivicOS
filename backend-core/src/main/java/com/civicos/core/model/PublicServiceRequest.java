package com.civicos.core.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "public_service_requests")
@Data
@lombok.EqualsAndHashCode(callSuper=true)
public class PublicServiceRequest extends Auditable {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(length = 13, nullable = false)
    private String citizenCnp;

    @Column(length = 255, nullable = false)
    private String citizenName;

    // e.g. URBANISM, STARE_CIVILA, SOCIAL, PARCARE
    @Column(length = 50, nullable = false)
    private String serviceType;

    // e.g. "Certificat Urbanism", "Viza Flotant", "Ajutor Incalzire"
    @Column(length = 100)
    private String subType;

    // JSON sau TEXT pentru detalii variate
    @Column(columnDefinition = "TEXT")
    private String details;

    // PENDING, APPROVED, REJECTED, INFO_NEEDED
    @Column(length = 50, nullable = false)
    private String status = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String resolutionMessage;

    

    
}

