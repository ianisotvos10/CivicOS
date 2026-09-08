package com.civicos.core.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "requests")
@Data
public class Request {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    // Relatia cu un user general (poate admin). Optional.
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "user_id", nullable = true)
    @JsonIgnore
    private User reporter;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String citizenEmail;

    // -- B2G Features (Heatmap, Routing, Translation) --
    private Double latitude;
    private Double longitude;
    
    @Column(length = 50)
    private String originalLanguage;
    
    @Column(columnDefinition = "TEXT")
    private String originalDescription;
    
    private Double estimatedCost;
    
    @Column(length = 150)
    private String routedContractor;
    // ----------------------------------------------------

    @Column(length = 50)
    private String aiCategory; 

    @Column(length = 50)
    private String aiUrgency;

    @Column(length = 50)
    private String aiSentiment;

    @Column(length = 255)
    private String aiLocation;

    @Column(length = 100)
    private String aiDepartment;

    @Column(length = 500)
    private String aiSummary;

    @Column(length = 1000)
    private String resolutionText;

    // --- Date Cetatean (Din OCR sau din Baza de Date) ---
    @Column(length = 100)
    private String citizenName;

    @Column(length = 13)
    private String citizenCnp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequestStatus status = RequestStatus.OPEN;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum RequestStatus {
        OPEN,
        IN_PROGRESS,
        RESOLVED,
        REJECTED
    }
}
