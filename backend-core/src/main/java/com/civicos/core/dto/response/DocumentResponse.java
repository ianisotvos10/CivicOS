package com.civicos.core.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class DocumentResponse {
    private UUID id;
    private String citizenCnp;
    private String citizenName;
    private String documentType;
    private String status;
    private LocalDateTime requestedAt;
    private LocalDateTime issuedAt;
    private String registrationNumber;
    private String purpose;
    private LocalDate validUntil;
    private String qrVerificationCode;
    private LocalDateTime issueDate;
}
