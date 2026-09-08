package com.civicos.core.controller;

import com.civicos.core.model.User;
import com.civicos.core.model.Tenant;
import com.civicos.core.repository.UserRepository;
import com.civicos.core.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;

    @Autowired
    public UserController(UserRepository userRepository, TenantRepository tenantRepository) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
    }

    // Crearea unui utilizator nou, atașat de o primărie
    @PostMapping("/tenant/{tenantId}")
    public ResponseEntity<?> createUser(@PathVariable UUID tenantId, @RequestBody User user) {
        
        // 1. Verificăm dacă primăria respectivă există în baza de date
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Eroare: Primaria nu a fost gasita!");
        }

        // 2. Asociem cetățeanul cu primăria găsită
        user.setTenant(tenant);
        
        // (Pentru MVP, parolăm hash-ul static. Într-un sistem real, aici se criptează cu BCrypt)
        if(user.getPasswordHash() == null) {
             user.setPasswordHash("dummy_hash_123");
        }

        // 3. Salvăm în baza de date
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }
}