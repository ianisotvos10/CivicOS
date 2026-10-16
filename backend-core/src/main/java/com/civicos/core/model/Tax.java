package com.civicos.core.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "taxes")
@Data
@lombok.EqualsAndHashCode(callSuper=true)
public class Tax extends Auditable {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String citizenCnp;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String category = "TAXA";

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false)
    private boolean isPaid = false;

    private LocalDateTime paidAt;

    private String issuedBy;
    private String processNumber;
    private LocalDate issuedDate;

    @Column(columnDefinition = "TEXT")
    private String contestation;

    private String contestationStatus;

    @Column(columnDefinition = "TEXT")
    private String contestationResponse;

    private LocalDate discountDeadline;

    @JsonProperty("title")
    public String getTitle() {
        return this.type;
    }

    @JsonProperty("status")
    public String getStatus() {
        return this.isPaid ? "PAID" : "UNPAID";
    }
}
