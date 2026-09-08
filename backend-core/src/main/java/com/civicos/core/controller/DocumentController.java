package com.civicos.core.controller;

import com.civicos.core.model.OfficialDocument;
import com.civicos.core.repository.OfficialDocumentRepository;
import com.civicos.core.service.PdfGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    @Autowired private OfficialDocumentRepository repo;
    @Autowired private PdfGeneratorService pdfService;

    @GetMapping("/all")
    public ResponseEntity<java.util.List<OfficialDocument>> getAllDocuments() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/citizen/{cnp}")
    public List<OfficialDocument> getDocuments(@PathVariable String cnp) {
        return repo.findByCitizenCnpOrderByRequestedAtDesc(cnp);
    }

    @PostMapping
    public OfficialDocument requestDocument(@RequestBody OfficialDocument doc) {
        // AI Auto-Approve logic - for zero bureaucracy, if citizen is logged in and verified via OCR, we auto-issue
        doc.setStatus("ISSUED");
        doc.setIssuedAt(LocalDateTime.now());
        return repo.save(doc);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable UUID id) {
        return repo.findById(id).map(doc -> {
            if (!"ISSUED".equals(doc.getStatus())) return ResponseEntity.badRequest().<byte[]>build();
            byte[] pdf = pdfService.generateOfficialDocument(doc.getCitizenName(), doc.getCitizenCnp(), doc.getDocumentType(), doc.getId());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment().filename("Document_" + doc.getDocumentType().replace(" ", "_") + ".pdf").build());
            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        }).orElse(ResponseEntity.notFound().build());
    }
}
