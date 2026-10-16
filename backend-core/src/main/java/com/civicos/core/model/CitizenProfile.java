package com.civicos.core.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "citizen_profiles")
public class CitizenProfile extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nume;

    @Column(nullable = false)
    private String prenume;

    @Column(unique = true, nullable = false, length = 13)
    private String cnp;

    @Column(length = 2)
    private String serie;

    @Column(length = 6)
    private String numar;

    @Column(columnDefinition = "TEXT")
    private String adresa;

    @Column(name = "data_expirare")
    private String dataExpirare; // Format YYYY-MM-DD

    @Column(length = 100)
        @jakarta.persistence.Convert(converter = com.civicos.core.security.CryptoConverter.class)
    private String telefon;

    @Column(length = 100)
        @jakarta.persistence.Convert(converter = com.civicos.core.security.CryptoConverter.class)
    private String email;

    @CreationTimestamp
    @Column(updatable = false)

    @UpdateTimestamp

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNume() { return nume; }
    public void setNume(String nume) { this.nume = nume; }

    public String getPrenume() { return prenume; }
    public void setPrenume(String prenume) { this.prenume = prenume; }

    public String getCnp() { return cnp; }
    public void setCnp(String cnp) { this.cnp = cnp; }

    public String getSerie() { return serie; }
    public void setSerie(String serie) { this.serie = serie; }

    public String getNumar() { return numar; }
    public void setNumar(String numar) { this.numar = numar; }

    public String getAdresa() { return adresa; }
    public void setAdresa(String adresa) { this.adresa = adresa; }

    public String getDataExpirare() { return dataExpirare; }
    public void setDataExpirare(String dataExpirare) { this.dataExpirare = dataExpirare; }

    public String getTelefon() { return telefon; }
    public void setTelefon(String telefon) { this.telefon = telefon; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

}
