package com.civicos.core.controller;

import com.civicos.core.model.CityAlert;
import com.civicos.core.repository.CityAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
@CrossOrigin(origins = "*")
public class CityAlertController {

    @Autowired private CityAlertRepository repo;

    @GetMapping
    public List<CityAlert> getActiveAlerts() {
        return repo.findByActiveTrueOrderByCreatedAtDesc();
    }

    @PostMapping
    public CityAlert createAlert(@RequestBody CityAlert alert) {
        return repo.save(alert);
    }
}
