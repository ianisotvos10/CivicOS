package com.civicos.core.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "request_events")
@Data
@lombok.EqualsAndHashCode(callSuper=true)
public class RequestEvent extends Auditable {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private UUID requestId;

    // SUBMITTED, IN_REVIEW, ASSIGNED, RESOLVED, REJECTED
    @Column(nullable = false, length = 50)
    private String eventType;

    @Column(columnDefinition = "TEXT")
    private String description;


    
}
