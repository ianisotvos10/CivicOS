package com.civicos.core.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class TaxResponse {
    private UUID id;
    private String citizenCnp;
    private String type;
    private String category;
    private Double amount;
    private LocalDate dueDate;
    private boolean isPaid;
    private LocalDateTime paidAt;
    private String issuedBy;
    private String processNumber;
    private LocalDate issuedDate;
    private String contestation;
    private String contestationStatus;
    private String contestationResponse;
    private LocalDate discountDeadline;
    private String title;
    private String status;
}
