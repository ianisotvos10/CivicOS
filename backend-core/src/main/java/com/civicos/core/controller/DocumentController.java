package com.civicos.core.controller;

import com.civicos.core.dto.request.DocumentCreateRequest;
import com.civicos.core.dto.response.DocumentResponse;
import com.civicos.core.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @GetMapping("/all")
    public ResponseEntity<List<DocumentResponse>> getAllDocuments() {
        return ResponseEntity.ok(documentService.getAllDocuments());
    }

    @GetMapping("/citizen/{cnp}")
    public List<DocumentResponse> getDocuments(@PathVariable String cnp) {
        return documentService.getDocumentsByCnp(cnp);
    }

    @PostMapping
    public DocumentResponse requestDocument(@Valid @RequestBody DocumentCreateRequest request) {
        return documentService.requestDocument(request);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable UUID id) {
        return documentService.generateDocumentPdf(id).map(pdf -> {
            String docType = documentService.getRawDocument(id).map(d -> d.getDocumentType()).orElse("Unknown");
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment().filename("Document_" + docType.replace(" ", "_") + ".pdf").build());
            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        }).orElse(ResponseEntity.badRequest().build());
    }

    @GetMapping("/verify/{qrCode}")
    public ResponseEntity<DocumentResponse> verifyDocument(@PathVariable String qrCode) {
        return documentService.verifyDocument(qrCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/fiscal-status/{cnp}")
    public ResponseEntity<Map<String, Object>> getFiscalStatus(@PathVariable String cnp) {
        return ResponseEntity.ok(documentService.getFiscalStatus(cnp));
    }
}
