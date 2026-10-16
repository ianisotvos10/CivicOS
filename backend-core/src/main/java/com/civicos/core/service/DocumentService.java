package com.civicos.core.service;

import com.civicos.core.dto.request.DocumentCreateRequest;
import com.civicos.core.dto.response.DocumentResponse;
import com.civicos.core.model.OfficialDocument;
import com.civicos.core.model.Tax;
import com.civicos.core.repository.OfficialDocumentRepository;
import com.civicos.core.repository.TaxRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    @Autowired
    private OfficialDocumentRepository repo;

    @Autowired
    private TaxRepository taxRepository;

    @Autowired
    private PdfGeneratorService pdfService;

    /**
     * Returneaza toate documentele din sistem. Cached cu cheia "all".
     */
    @Cacheable(value = "documents", key = "'all'")
    public List<DocumentResponse> getAllDocuments() {
        return repo.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Returneaza documentele unui cetatean dupa CNP. Cached pe CNP.
     */
    @Cacheable(value = "documents", key = "#cnp")
    public List<DocumentResponse> getDocumentsByCnp(String cnp) {
        return repo.findByCitizenCnpOrderByRequestedAtDesc(cnp).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Creeaza un document nou si invalideaza cache-ul pentru CNP-ul respectiv.
     */
    @CacheEvict(value = "documents", allEntries = true)
    public DocumentResponse requestDocument(DocumentCreateRequest request) {
        OfficialDocument doc = new OfficialDocument();
        doc.setCitizenCnp(request.getCitizenCnp());
        doc.setCitizenName(request.getCitizenName());
        doc.setDocumentType(request.getDocumentType());
        doc.setPurpose(request.getPurpose());
        doc.setStatus("ISSUED");
        doc.setRequestedAt(LocalDateTime.now());
        doc.setIssuedAt(LocalDateTime.now());
        doc.setValidUntil(LocalDate.now().plusDays(30));

        return mapToResponse(repo.save(doc));
    }

    /**
     * Genereaza PDF-ul unui document emis.
     */
    public Optional<byte[]> generateDocumentPdf(UUID id) {
        return repo.findById(id).map(doc -> {
            if (!"ISSUED".equals(doc.getStatus())) return null;
            byte[] pdf;
            String validUntilStr = doc.getValidUntil() != null
                    ? doc.getValidUntil().format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))
                    : "";

            if (doc.getDocumentType() != null && doc.getDocumentType().toLowerCase().contains("fiscal")) {
                List<Tax> taxes = taxRepository.findByCitizenCnpOrderByDueDateAsc(doc.getCitizenCnp());
                List<Tax> unpaid = taxes.stream().filter(t -> !t.isPaid()).collect(Collectors.toList());
                boolean hasDebts = !unpaid.isEmpty();
                double totalDebts = unpaid.stream().mapToDouble(Tax::getAmount).sum();
                List<String> debtDetails = unpaid.stream()
                        .map(t -> t.getType() + " - " + t.getAmount() + " RON")
                        .collect(Collectors.toList());

                pdf = pdfService.generateFiscalCertificate(
                        doc.getCitizenName(), doc.getCitizenCnp(), doc.getId(),
                        doc.getQrVerificationCode(), validUntilStr,
                        hasDebts, totalDebts, debtDetails);
            } else {
                pdf = pdfService.generateOfficialDocument(
                        doc.getCitizenName(), doc.getCitizenCnp(), doc.getDocumentType(),
                        doc.getId(), doc.getQrVerificationCode(), validUntilStr);
            }
            return pdf;
        });
    }

    public Optional<OfficialDocument> getRawDocument(UUID id) {
        return repo.findById(id);
    }

    /**
     * Verifica autenticitatea unui document dupa codul QR.
     */
    public Optional<DocumentResponse> verifyDocument(String qrCode) {
        return repo.findAll().stream()
                .filter(d -> qrCode.equals(d.getQrVerificationCode()))
                .findFirst()
                .map(this::mapToResponse);
    }

    /**
     * Returneaza statusul fiscal al unui cetatean (datorii neplatite).
     */
    public Map<String, Object> getFiscalStatus(String cnp) {
        List<Tax> taxes = taxRepository.findByCitizenCnpOrderByDueDateAsc(cnp);
        List<Tax> unpaid = taxes.stream().filter(t -> !t.isPaid()).collect(Collectors.toList());
        boolean hasDebts = !unpaid.isEmpty();
        double totalDebts = unpaid.stream().mapToDouble(Tax::getAmount).sum();
        List<String> debtDetails = unpaid.stream()
                .map(t -> t.getType() + " - " + t.getAmount() + " RON")
                .collect(Collectors.toList());

        return Map.of(
                "hasDebts", hasDebts,
                "totalDebts", totalDebts,
                "debtDetails", debtDetails
        );
    }

    private DocumentResponse mapToResponse(OfficialDocument doc) {
        DocumentResponse response = new DocumentResponse();
        response.setId(doc.getId());
        response.setCitizenCnp(doc.getCitizenCnp());
        response.setCitizenName(doc.getCitizenName());
        response.setDocumentType(doc.getDocumentType());
        response.setStatus(doc.getStatus());
        response.setRequestedAt(doc.getRequestedAt());
        response.setIssuedAt(doc.getIssuedAt());
        response.setRegistrationNumber(doc.getRegistrationNumber());
        response.setPurpose(doc.getPurpose());
        response.setValidUntil(doc.getValidUntil());
        response.setQrVerificationCode(doc.getQrVerificationCode());
        response.setIssueDate(doc.getIssueDate());
        return response;
    }
}
