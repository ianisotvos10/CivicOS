package com.civicos.core.service;

import com.civicos.core.dto.request.PublicServiceRequestCreate;
import com.civicos.core.dto.request.ResolvePublicServiceRequest;
import com.civicos.core.dto.response.PublicServiceRequestResponse;
import com.civicos.core.model.PublicServiceRequest;
import com.civicos.core.repository.PublicServiceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PublicServiceRequestService {

    @Autowired
    private PublicServiceRequestRepository repository;

    /**
     * Returneaza toate cererile de servicii publice. Cached cu cheia "all".
     */
    @Cacheable(value = "services", key = "'all'")
    public List<PublicServiceRequestResponse> getAllRequests() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Populeaza date mock pentru un CNP. Invalideaza cache-ul dupa populare.
     */
    @CacheEvict(value = "services", allEntries = true)
    public void populateMock(String cnp) {
        if (repository.findByCitizenCnpOrderByCreatedAtDesc(cnp).isEmpty()) {
            PublicServiceRequest r1 = new PublicServiceRequest();
            r1.setCitizenCnp(cnp);
            r1.setCitizenName("Popescu Ion");
            r1.setServiceType("URBANISM");
            r1.setSubType("Certificat de Urbanism");
            r1.setDetails("{\"nr_cadastral\": \"123456\", \"scop\": \"Construire Casa P+1\"}");
            r1.setStatus("PENDING");

            PublicServiceRequest r2 = new PublicServiceRequest();
            r2.setCitizenCnp(cnp);
            r2.setCitizenName("Popescu Ion");
            r2.setServiceType("PARCARE");
            r2.setSubType("Cerere Loc Parcare Reședință");
            r2.setDetails("{\"numar_auto\": \"CJ 01 ABC\"}");
            r2.setStatus("APPROVED");
            r2.setResolutionMessage("Locul de parcare nr. 42 a fost alocat cu succes.");

            PublicServiceRequest r3 = new PublicServiceRequest();
            r3.setCitizenCnp("2991234567890");
            r3.setCitizenName("Maria Ionescu");
            r3.setServiceType("SOCIAL");
            r3.setSubType("Cerere Ajutor Social (Încălzire)");
            r3.setDetails("{\"tip_ajutor\": \"incalzire\", \"declaratie_venit\": \"conform bazelor de date ANAF\"}");
            r3.setStatus("PENDING");

            repository.saveAll(List.of(r1, r2, r3));
        }
    }

    /**
     * Returneaza cererile unui cetatean. Cached pe CNP.
     */
    @Cacheable(value = "services", key = "#cnp")
    public List<PublicServiceRequestResponse> getByCitizen(String cnp) {
        return repository.findByCitizenCnpOrderByCreatedAtDesc(cnp).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Creeaza o cerere noua si invalideaza cache-ul.
     */
    @CacheEvict(value = "services", allEntries = true)
    public PublicServiceRequestResponse createRequest(PublicServiceRequestCreate request) {
        PublicServiceRequest psr = new PublicServiceRequest();
        psr.setCitizenCnp(request.getCitizenCnp());
        psr.setCitizenName(request.getCitizenName());
        psr.setServiceType(request.getServiceType());
        psr.setSubType(request.getSubType());
        psr.setDetails(request.getDetails());
        psr.setStatus(request.getStatus() != null ? request.getStatus() : "PENDING");

        return mapToResponse(repository.save(psr));
    }

    /**
     * Rezolva o cerere si invalideaza cache-ul.
     */
    @CacheEvict(value = "services", allEntries = true)
    public Optional<PublicServiceRequestResponse> resolveRequest(UUID id, ResolvePublicServiceRequest request) {
        return repository.findById(id).map(psr -> {
            if (request.getStatus() != null) {
                psr.setStatus(request.getStatus());
            }
            if (request.getResolutionMessage() != null) {
                psr.setResolutionMessage(request.getResolutionMessage());
            }
            return mapToResponse(repository.save(psr));
        });
    }

    private PublicServiceRequestResponse mapToResponse(PublicServiceRequest psr) {
        PublicServiceRequestResponse response = new PublicServiceRequestResponse();
        response.setId(psr.getId());
        response.setCitizenCnp(psr.getCitizenCnp());
        response.setCitizenName(psr.getCitizenName());
        response.setServiceType(psr.getServiceType());
        response.setSubType(psr.getSubType());
        response.setDetails(psr.getDetails());
        response.setStatus(psr.getStatus());
        response.setResolutionMessage(psr.getResolutionMessage());
        return response;
    }
}
