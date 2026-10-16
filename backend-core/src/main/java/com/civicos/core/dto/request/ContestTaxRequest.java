package com.civicos.core.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ContestTaxRequest {
    @NotBlank(message = "Motivation is required")
    private String motivation;
}
