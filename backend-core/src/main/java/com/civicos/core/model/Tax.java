package com.civicos.core.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "taxes")
@Data
public class Tax {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String citizenCnp;

    @Column(nullable = false)
    private String type; // ex: Impozit Auto, Salubritate, Amenda Parcare

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false)
    private boolean isPaid = false;

    private LocalDateTime paidAt;
}
