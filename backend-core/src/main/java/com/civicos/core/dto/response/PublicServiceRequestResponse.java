package com.civicos.core.dto.response;

import lombok.Data;
import java.util.UUID;

@Data
public class PublicServiceRequestResponse {
    private UUID id;
    private String citizenCnp;
    private String citizenName;
    private String serviceType;
    private String subType;
    private String details;
    private String status;
    private String resolutionMessage;
}
