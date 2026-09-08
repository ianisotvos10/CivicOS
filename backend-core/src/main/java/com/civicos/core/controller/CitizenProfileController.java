package com.civicos.core.controller;

import com.civicos.core.model.CitizenProfile;
import com.civicos.core.repository.CitizenProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/citizens")
public class CitizenProfileController {

    @Autowired
    private CitizenProfileRepository citizenRepository;

    @PostMapping("/login")
    public ResponseEntity<CitizenProfile> loginCitizen(@RequestBody CitizenProfile ocrData) {
        if (ocrData.getCnp() == null || ocrData.getCnp().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<CitizenProfile> existingOpt = citizenRepository.findByCnp(ocrData.getCnp());
        if (existingOpt.isPresent()) {
            CitizenProfile existing = existingOpt.get();
            // Actualizam datele in caz ca a venit cu un buletin nou (adresa noua, expirare noua)
            if (ocrData.getNume() != null) existing.setNume(ocrData.getNume());
            if (ocrData.getPrenume() != null) existing.setPrenume(ocrData.getPrenume());
            if (ocrData.getAdresa() != null) existing.setAdresa(ocrData.getAdresa());
            if (ocrData.getSerie() != null) existing.setSerie(ocrData.getSerie());
            if (ocrData.getNumar() != null) existing.setNumar(ocrData.getNumar());
            if (ocrData.getDataExpirare() != null) existing.setDataExpirare(ocrData.getDataExpirare());
            
            CitizenProfile saved = citizenRepository.save(existing);
            return ResponseEntity.ok(saved);
        } else {
            // Este un cetatean complet nou, il inseram in Baza de Date
            CitizenProfile saved = citizenRepository.save(ocrData);
            return ResponseEntity.ok(saved);
        }
    }
}
