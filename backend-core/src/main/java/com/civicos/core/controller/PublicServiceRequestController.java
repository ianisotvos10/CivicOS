package com.civicos.core.controller;

import com.civicos.core.dto.request.PublicServiceRequestCreate;
import com.civicos.core.dto.request.ResolvePublicServiceRequest;
import com.civicos.core.dto.response.PublicServiceRequestResponse;
import com.civicos.core.service.PublicServiceRequestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/services")
@CrossOrigin(origins = "*")
public class PublicServiceRequestController {

    @Autowired
    private PublicServiceRequestService service;

    @GetMapping("/all")
    public List<PublicServiceRequestResponse> getAllRequests() {
        return service.getAllRequests();
    }

    @PostMapping("/mock-populate/{cnp}")
    public ResponseEntity<String> populateMock(@PathVariable String cnp) {
        service.populateMock(cnp);
        return ResponseEntity.ok("Mock service requests populated.");
    }

    @GetMapping("/citizen/{cnp}")
    public List<PublicServiceRequestResponse> getByCitizen(@PathVariable String cnp) {
        return service.getByCitizen(cnp);
    }

    @PostMapping("/request")
    public ResponseEntity<PublicServiceRequestResponse> createRequest(@Valid @RequestBody PublicServiceRequestCreate request) {
        return ResponseEntity.ok(service.createRequest(request));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<PublicServiceRequestResponse> resolveRequest(
            @PathVariable UUID id,
            @RequestBody ResolvePublicServiceRequest body) {
        return service.resolveRequest(id, body)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
