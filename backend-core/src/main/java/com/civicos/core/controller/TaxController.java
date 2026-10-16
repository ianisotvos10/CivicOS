package com.civicos.core.controller;

import com.civicos.core.dto.request.ContestTaxRequest;
import com.civicos.core.dto.request.ResolveContestRequest;
import com.civicos.core.dto.response.TaxResponse;
import com.civicos.core.service.TaxService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/taxes")
@CrossOrigin(origins = "*")
public class TaxController {

    @Autowired
    private TaxService taxService;

    @PostMapping("/mock-populate/{cnp}")
    public ResponseEntity<String> populateMockTaxes(@PathVariable String cnp) {
        taxService.populateMockTaxes(cnp);
        return ResponseEntity.ok("Taxe populate");
    }

    @GetMapping("/all")
    public ResponseEntity<List<TaxResponse>> getAllTaxes() {
        return ResponseEntity.ok(taxService.getAllTaxes());
    }

    @GetMapping("/citizen/{cnp}")
    public List<TaxResponse> getTaxes(@PathVariable String cnp) {
        return taxService.getTaxesByCnp(cnp);
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<TaxResponse> payTax(@PathVariable UUID id) {
        return taxService.payTax(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable UUID id) {
        return taxService.generateReceipt(id).map(pdf -> {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment().filename("Chitanta_" + id.toString().substring(0,8) + ".pdf").build());
            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        }).orElse(ResponseEntity.badRequest().build());
    }

    @PostMapping("/{id}/contest")
    public ResponseEntity<TaxResponse> contestTax(@PathVariable UUID id, @Valid @RequestBody ContestTaxRequest request) {
        return taxService.contestTax(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/contest-resolve")
    public ResponseEntity<TaxResponse> resolveContest(@PathVariable UUID id, @Valid @RequestBody ResolveContestRequest request) {
        return taxService.resolveContest(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
