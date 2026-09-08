package com.civicos.core.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "poll_votes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"poll_id", "citizen_cnp"})
})
@Data
public class PollVote {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "poll_id", nullable = false)
    private UUID pollId;

    @Column(name = "citizen_cnp", nullable = false, length = 13)
    private String citizenCnp;

    @Column(nullable = false)
    private Integer optionIndex;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
