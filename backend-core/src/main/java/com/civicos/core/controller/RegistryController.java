package com.civicos.core.controller;

import com.civicos.core.model.CitizenProfile;
import com.civicos.core.repository.CitizenProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/registry")
@CrossOrigin(origins = "*") // Permite apeluri din frontend (React)
public class RegistryController {

    @Autowired
    private CitizenProfileRepository citizenProfileRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8001/classify}")
    private String aiServiceUrl; // ex: http://localhost:8001/classify

    @GetMapping("/profiles")
    public List<CitizenProfile> getAllProfiles() {
        return citizenProfileRepository.findAll();
    }

    @PostMapping("/upload-id")
    public ResponseEntity<?> uploadIdCard(@RequestParam("file") MultipartFile file) {
        try {
            // 1. Convertim imaginea în Base64. (Notă: În frontend dăm direct file, așa că va fi conținutul curat al fișierului, nu o imagine cu prefix Base64).
            byte[] fileContent = file.getBytes();
            String encodedString = Base64.getEncoder().encodeToString(fileContent);
            String mimeType = file.getContentType();
            
            // 2. Trimitem la AI pentru OCR
            String ocrUrl = aiServiceUrl.replace("/classify", "/extract-ocr");
            
            Map<String, String> aiPayload = new HashMap<>();
            aiPayload.put("image_base64", encodedString);
            aiPayload.put("mime_type", mimeType != null ? mimeType : "image/jpeg");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(aiPayload, headers);

            ResponseEntity<CitizenProfile> aiResponseEntity = restTemplate.exchange(
                ocrUrl, org.springframework.http.HttpMethod.POST, requestEntity,
                CitizenProfile.class
            );

            CitizenProfile profile = aiResponseEntity.getBody();
            if (profile == null) {
                return ResponseEntity.internalServerError().body("Eroare la procesare OCR.");
            }

            // 3. (Opțional) Salvăm direct, dar e mai bine ca funcționarul să verifice întâi
            // Totuși, pt flow-ul nostru o să-l salvăm în baza de date ca validare finală, 
            // sau doar returnăm către frontend și ei validează, chemând apoi un endpoint de save.
            // Pentru simplitate, doar returnăm datele extrase frontend-ului, iar UI-ul
            // va afișa formularul și va face POST pe un alt endpoint.

            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("A apărut o eroare la procesarea fișierului: " + e.getMessage());
        }
    }

    @PostMapping("/profiles")
    public ResponseEntity<CitizenProfile> createProfile(@RequestBody CitizenProfile profile) {
        CitizenProfile saved = citizenProfileRepository.save(profile);
        return ResponseEntity.ok(saved);
    }
}

