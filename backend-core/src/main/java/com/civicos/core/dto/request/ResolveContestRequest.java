package com.civicos.core.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResolveContestRequest {
    @NotNull(message = "Approved status is required")
    private Boolean approved;
    
    private String response;
}
