package com.civicos.core.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PublicServiceRequestCreate {
    @NotBlank(message = "Citizen CNP is required")
    private String citizenCnp;
    
    @NotBlank(message = "Citizen name is required")
    private String citizenName;
    
    @NotBlank(message = "Service type is required")
    private String serviceType;
    
    private String subType;
    private String details;
    private String status;
}
