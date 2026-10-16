package com.civicos.core.service;

import com.civicos.core.dto.request.ContestTaxRequest;
import com.civicos.core.dto.request.ResolveContestRequest;
import com.civicos.core.dto.response.TaxResponse;
import com.civicos.core.model.Tax;
import com.civicos.core.repository.TaxRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TaxService {

    @Autowired
    private TaxRepository taxRepository;

    @Autowired
    private PdfGeneratorService pdfService;

    /**
     * Populeaza date mock pentru un CNP dat, daca nu exista deja.
     * Invalideaza cache-ul pentru CNP-ul respectiv dupa populare.
     */
    @CacheEvict(value = "taxes", key = "#cnp")
    public void populateMockTaxes(String cnp) {
        if (taxRepository.findByCitizenCnpOrderByDueDateAsc(cnp).isEmpty()) {
            Tax t1 = new Tax(); t1.setCitizenCnp(cnp); t1.setType("Impozit pe Cladire"); t1.setAmount(2500.00); t1.setCategory("IMPOZIT"); t1.setDueDate(LocalDate.now().plusMonths(3));
            Tax t2 = new Tax(); t2.setCitizenCnp(cnp); t2.setType("Impozit pe Teren"); t2.setAmount(180.00); t2.setCategory("IMPOZIT"); t2.setDueDate(LocalDate.now().plusMonths(3));
            Tax t3 = new Tax(); t3.setCitizenCnp(cnp); t3.setType("Impozit pe Auto - CJ 99 ABC"); t3.setAmount(420.00); t3.setCategory("IMPOZIT"); t3.setDueDate(LocalDate.now().plusMonths(2));
            Tax t4 = new Tax(); t4.setCitizenCnp(cnp); t4.setType("Taxa Salubritate 2026"); t4.setAmount(85.50); t4.setCategory("TAXA"); t4.setDueDate(LocalDate.now().plusMonths(1));
            Tax t5 = new Tax(); t5.setCitizenCnp(cnp); t5.setType("Taxa Gunoi Selectiv"); t5.setAmount(45.00); t5.setCategory("TAXA"); t5.setDueDate(LocalDate.now().plusDays(20));
            Tax t6 = new Tax(); t6.setCitizenCnp(cnp); t6.setType("Amenda Parcare Neregulamentara"); t6.setAmount(500.00); t6.setCategory("AMENDA"); t6.setIssuedBy("Politia Locala Cluj-Napoca"); t6.setProcessNumber("PV-2026-04521"); t6.setIssuedDate(LocalDate.now().minusDays(10)); t6.setDiscountDeadline(LocalDate.now().plusDays(5)); t6.setDueDate(LocalDate.now().plusDays(15));
            Tax t7 = new Tax(); t7.setCitizenCnp(cnp); t7.setType("Amenda Depozitare Deseuri"); t7.setAmount(1000.00); t7.setCategory("AMENDA"); t7.setIssuedBy("Garda de Mediu Cluj"); t7.setProcessNumber("PV-2026-00893"); t7.setIssuedDate(LocalDate.now().minusDays(30)); t7.setDiscountDeadline(LocalDate.now().minusDays(15)); t7.setDueDate(LocalDate.now().plusDays(5)); t7.setPaid(false);

            taxRepository.saveAll(List.of(t1, t2, t3, t4, t5, t6, t7));
        }
    }

    /**
     * Returneaza toate taxele. Cached cu cheia "all".
     */
    @Cacheable(value = "taxes", key = "'all'")
    public List<TaxResponse> getAllTaxes() {
        return taxRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Returneaza taxele unui cetatean dupa CNP.
     * Cached cu cheia CNP-ului — rezultatele sunt invalidate automat la orice scriere.
     */
    @Cacheable(value = "taxes", key = "#cnp")
    public List<TaxResponse> getTaxesByCnp(String cnp) {
        return taxRepository.findByCitizenCnpOrderByDueDateAsc(cnp).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Plateste o taxa si invalideaza cache-ul pentru CNP-ul asociat.
     */
    public Optional<TaxResponse> payTax(UUID id) {
        return taxRepository.findById(id).map(tax -> {
            tax.setPaid(true);
            tax.setPaidAt(LocalDateTime.now());
            TaxResponse result = mapToResponse(taxRepository.save(tax));
            evictTaxCache(tax.getCitizenCnp());
            return result;
        });
    }

    /**
     * Genereaza chitanta PDF pentru o taxa platita.
     */
    public Optional<byte[]> generateReceipt(UUID id) {
        return taxRepository.findById(id).map(tax -> {
            if (!tax.isPaid()) return null;
            return pdfService.generateReceipt(tax.getCitizenCnp(), tax.getType(), tax.getAmount(), tax.getId());
        });
    }

    /**
     * Inregistreaza o contestatie si invalideaza cache-ul.
     */
    public Optional<TaxResponse> contestTax(UUID id, ContestTaxRequest request) {
        return taxRepository.findById(id).map(tax -> {
            tax.setContestation(request.getMotivation());
            tax.setContestationStatus("PENDING");
            TaxResponse result = mapToResponse(taxRepository.save(tax));
            evictTaxCache(tax.getCitizenCnp());
            return result;
        });
    }

    /**
     * Rezolva o contestatie si invalideaza cache-ul.
     */
    public Optional<TaxResponse> resolveContest(UUID id, ResolveContestRequest request) {
        return taxRepository.findById(id).map(tax -> {
            boolean approved = Boolean.TRUE.equals(request.getApproved());
            tax.setContestationStatus(approved ? "APPROVED" : "REJECTED");
            tax.setContestationResponse(request.getResponse());

            if (approved && "AMENDA".equals(tax.getCategory())) {
                tax.setPaid(false);
                tax.setAmount(0.0);
            }
            TaxResponse result = mapToResponse(taxRepository.save(tax));
            evictTaxCache(tax.getCitizenCnp());
            return result;
        });
    }

    /**
     * Invalideaza manual cache-ul pentru un CNP specific si pentru lista globala.
     */
    @CacheEvict(value = "taxes", allEntries = true)
    public void evictTaxCache(String cnp) {
        // Acest metod invalideaza toate intrarile din cache-ul "taxes"
        // (inclusiv per-CNP si "all")
    }

    private TaxResponse mapToResponse(Tax tax) {
        TaxResponse response = new TaxResponse();
        response.setId(tax.getId());
        response.setCitizenCnp(tax.getCitizenCnp());
        response.setType(tax.getType());
        response.setCategory(tax.getCategory());
        response.setAmount(tax.getAmount());
        response.setDueDate(tax.getDueDate());
        response.setPaid(tax.isPaid());
        response.setPaidAt(tax.getPaidAt());
        response.setIssuedBy(tax.getIssuedBy());
        response.setProcessNumber(tax.getProcessNumber());
        response.setIssuedDate(tax.getIssuedDate());
        response.setContestation(tax.getContestation());
        response.setContestationStatus(tax.getContestationStatus());
        response.setContestationResponse(tax.getContestationResponse());
        response.setDiscountDeadline(tax.getDiscountDeadline());
        response.setTitle(tax.getTitle());
        response.setStatus(tax.getStatus());
        return response;
    }
}
