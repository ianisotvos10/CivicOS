package com.civicos.core.controller;

import com.civicos.core.model.Tax;
import com.civicos.core.repository.TaxRepository;
import com.civicos.core.service.PdfGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/taxes")
@CrossOrigin(origins = "*")
public class TaxController {

    @Autowired private TaxRepository taxRepository;
    @Autowired private PdfGeneratorService pdfService;

    // Helper pt a popula date de test pt un cetatean
    @PostMapping("/mock-populate/{cnp}")
    public ResponseEntity<String> populateMockTaxes(@PathVariable String cnp) {
        if (taxRepository.findByCitizenCnpOrderByDueDateAsc(cnp).isEmpty()) {
            Tax t1 = new Tax(); t1.setCitizenCnp(cnp); t1.setType("Impozit Auto (B 123 ABC)"); t1.setAmount(120.0); t1.setDueDate(LocalDate.now().plusMonths(2));
            Tax t2 = new Tax(); t2.setCitizenCnp(cnp); t2.setType("Taxa Salubritate 2026"); t2.setAmount(65.50); t2.setDueDate(LocalDate.now().plusDays(15));
            Tax t3 = new Tax(); t3.setCitizenCnp(cnp); t3.setType("Amenda Parcare neregulamentara"); t3.setAmount(300.0); t3.setDueDate(LocalDate.now().minusDays(5));
            taxRepository.saveAll(List.of(t1, t2, t3));
        }
        return ResponseEntity.ok("Taxe populate");
    }

    @GetMapping("/all")
    public ResponseEntity<java.util.List<Tax>> getAllTaxes() {
        return ResponseEntity.ok(taxRepository.findAll());
    }

    @GetMapping("/citizen/{cnp}")
    public List<Tax> getTaxes(@PathVariable String cnp) {
        return taxRepository.findByCitizenCnpOrderByDueDateAsc(cnp);
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<Tax> payTax(@PathVariable UUID id) {
        return taxRepository.findById(id).map(tax -> {
            tax.setPaid(true);
            tax.setPaidAt(LocalDateTime.now());
            return ResponseEntity.ok(taxRepository.save(tax));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable UUID id) {
        return taxRepository.findById(id).map(tax -> {
            if (!tax.isPaid()) return ResponseEntity.badRequest().<byte[]>build();
            byte[] pdf = pdfService.generateReceipt(tax.getCitizenCnp(), tax.getType(), tax.getAmount(), tax.getId());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment().filename("Chitanta_" + id.toString().substring(0,8) + ".pdf").build());
            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        }).orElse(ResponseEntity.notFound().build());
    }
}
