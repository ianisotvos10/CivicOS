package com.civicos.core.controller;

import com.civicos.core.model.Request;
import com.civicos.core.model.RequestEvent;
import com.civicos.core.repository.RequestRepository;
import com.civicos.core.repository.RequestEventRepository;
import com.civicos.core.service.EmailNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/v1/requests")
@CrossOrigin(origins = "*")
public class RequestController {

    private static final Logger logger = LoggerFactory.getLogger(RequestController.class);

    @Autowired private RequestRepository requestRepository;
    @Autowired private RequestEventRepository requestEventRepository;
    @Autowired private EmailNotificationService emailService;

    @Value("${app.ai.service-url:http://localhost:8001/classify}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping
    public List<Request> getAllRequests() {
        return requestRepository.findAll();
    }

    @GetMapping("/citizen/{cnp}")
    public List<Request> getRequestsByCitizen(@PathVariable String cnp) {
        return requestRepository.findByCitizenCnp(cnp);
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<List<RequestEvent>> getRequestEvents(@PathVariable UUID id) {
        return ResponseEntity.ok(requestEventRepository.findByRequestIdOrderByCreatedAtAsc(id));
    }

    @PostMapping
    public Request createRequest(@RequestBody Request newRequest) {
        if (newRequest.getStatus() == null) newRequest.setStatus(Request.RequestStatus.OPEN);

        try {
            Map<String, String> aiPayload = new HashMap<>();
            aiPayload.put("title", newRequest.getTitle());
            aiPayload.put("description", newRequest.getDescription());
            aiPayload.put("status", newRequest.getStatus().name());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> reqEntity = new HttpEntity<>(aiPayload, headers);

            ResponseEntity<Map<String, String>> aiResp = restTemplate.exchange(
                aiServiceUrl, HttpMethod.POST, reqEntity,
                new org.springframework.core.ParameterizedTypeReference<>() {}
            );
            Map<String, String> ai = aiResp.getBody();
            if (ai != null) {
                if (ai.containsKey("category"))    newRequest.setAiCategory(ai.get("category"));
                if (ai.containsKey("urgency"))     newRequest.setAiUrgency(ai.get("urgency"));
                if (ai.containsKey("sentiment"))   newRequest.setAiSentiment(ai.get("sentiment"));
                if (ai.containsKey("location"))    newRequest.setAiLocation(ai.get("location"));
                if (ai.containsKey("department"))  newRequest.setAiDepartment(ai.get("department"));
                if (ai.containsKey("summary"))     newRequest.setAiSummary(ai.get("summary"));
                if (ai.containsKey("routed_contractor")) newRequest.setRoutedContractor(ai.get("routed_contractor"));
                if (ai.containsKey("detected_language")) newRequest.setOriginalLanguage(ai.get("detected_language"));
                try { if (ai.get("latitude") != null)       newRequest.setLatitude(Double.parseDouble(ai.get("latitude"))); } catch (Exception ignored) {}
                try { if (ai.get("longitude") != null)      newRequest.setLongitude(Double.parseDouble(ai.get("longitude"))); } catch (Exception ignored) {}
                try { if (ai.get("estimated_cost") != null) newRequest.setEstimatedCost(Double.parseDouble(ai.get("estimated_cost"))); } catch (Exception ignored) {}
                if (ai.get("translated_description") != null) {
                    newRequest.setOriginalDescription(newRequest.getDescription());
                    newRequest.setDescription(ai.get("translated_description"));
                }
            }
        } catch (RestClientException e) {
            logger.error("Eroare AI: {}", e.getMessage());
            newRequest.setAiCategory("Eroare AI");
        }

        Request saved = requestRepository.save(newRequest);
        createEvent(saved.getId(), "SUBMITTED", "Sesizarea a fost inregistrata si transmisa spre analiza.");
        return saved;
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Request> updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        Optional<Request> opt = requestRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Request req = opt.get();
        String newStatus = body.get("status");
        if (newStatus == null) return ResponseEntity.<Request>badRequest().build();
        String oldStatus = req.getStatus().name();
        try { req.setStatus(Request.RequestStatus.valueOf(newStatus)); }
        catch (IllegalArgumentException e) { return ResponseEntity.<Request>badRequest().build(); }
        Request updated = requestRepository.save(req);
        String desc = switch (newStatus) {
            case "IN_PROGRESS" -> "Sesizarea a fost preluata si este in curs de analiza.";
            case "RESOLVED"    -> "Sesizarea a fost rezolvata. Va multumim!";
            case "REJECTED"    -> "Sesizarea a fost respinsa. Consultati mesajul oficial.";
            default            -> "Status actualizat: " + newStatus;
        };
        createEvent(updated.getId(), newStatus, desc);
        if (!oldStatus.equals(newStatus) && updated.getCitizenEmail() != null && !updated.getCitizenEmail().isBlank()) {
            emailService.sendStatusUpdate(updated.getCitizenEmail(),
                updated.getCitizenName() != null ? updated.getCitizenName() : "Cetatean",
                updated.getTitle(), newStatus);
        }
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/draft-reply")
    public ResponseEntity<Map<String, String>> generateDraftReply(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        Optional<Request> opt = requestRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.<Map<String, String>>notFound().build();
        Request req = opt.get();
        String notes = body.get("notes");
        if (notes == null || notes.isEmpty()) return ResponseEntity.<Map<String, String>>badRequest().build();
        try {
            Map<String, String> aiPayload = new HashMap<>();
            aiPayload.put("request_title", req.getTitle());
            aiPayload.put("request_description", req.getDescription());
            aiPayload.put("bureaucrat_notes", notes);
            if (req.getOriginalLanguage() != null && !req.getOriginalLanguage().equalsIgnoreCase("ro"))
                aiPayload.put("original_language", req.getOriginalLanguage());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String draftUrl = aiServiceUrl.replace("/classify", "/draft-reply");
            ResponseEntity<Map<String, String>> aiResp = restTemplate.exchange(
                draftUrl, HttpMethod.POST, new HttpEntity<>(aiPayload, headers),
                new org.springframework.core.ParameterizedTypeReference<Map<String, String>>() {}
            );
            String replyText = aiResp.getBody().get("reply_text");
            req.setResolutionText(replyText);
            requestRepository.save(req);
            createEvent(req.getId(), "REPLY_DRAFTED", "A fost generat un raspuns oficial.");
            Map<String, String> result = new HashMap<>();
            result.put("reply", replyText);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Eroare generare raspuns", e);
            return ResponseEntity.<Map<String, String>>internalServerError().build();
        }
    }

    private void createEvent(UUID requestId, String type, String description) {
        try {
            RequestEvent ev = new RequestEvent();
            ev.setRequestId(requestId);
            ev.setEventType(type);
            ev.setDescription(description);
            requestEventRepository.save(ev);
        } catch (Exception e) {
            logger.warn("Event create failed: {}", e.getMessage());
        }
    }
}
