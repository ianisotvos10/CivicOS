package com.civicos.core.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DocumentCreateRequest {
    @NotBlank(message = "Citizen CNP is required")
    private String citizenCnp;
    
    @NotBlank(message = "Citizen name is required")
    private String citizenName;

    @NotBlank(message = "Document type is required")
    private String documentType;

    private String purpose;
}
