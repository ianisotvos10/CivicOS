package com.civicos.core.controller;

import com.civicos.core.model.Tenant;
import com.civicos.core.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tenants")
public class TenantController {

    private final TenantRepository tenantRepository;

    @Autowired
    public TenantController(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    // Endpoint pentru crearea unei noi Primării
    @PostMapping
    public ResponseEntity<Tenant> createTenant(@RequestBody Tenant tenant) {
        // În producție, aici ar fi validări și logica de business
        Tenant savedTenant = tenantRepository.save(tenant);
        return ResponseEntity.ok(savedTenant);
    }

    // Endpoint pentru afișarea tuturor primăriilor
    @GetMapping
    public ResponseEntity<List<Tenant>> getAllTenants() {
        return ResponseEntity.ok(tenantRepository.findAll());
    }
}