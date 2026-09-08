package com.civicos.core.repository;

import com.civicos.core.model.CityAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CityAlertRepository extends JpaRepository<CityAlert, UUID> {
    List<CityAlert> findByActiveTrueOrderByCreatedAtDesc();
}
