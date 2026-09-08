package com.civicos.core.repository;

import com.civicos.core.model.Tax;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TaxRepository extends JpaRepository<Tax, UUID> {
    List<Tax> findByCitizenCnpOrderByDueDateAsc(String citizenCnp);
}
