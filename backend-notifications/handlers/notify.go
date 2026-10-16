package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"civicos/notifications/hub"
)

// NotifyRequest este structura cererii primite de la Spring Boot
type NotifyRequest struct {
	Type       string `json:"type"`
	RequestID  string `json:"requestId,omitempty"`
	CitizenCnp string `json:"citizenCnp,omitempty"`
	Status     string `json:"status,omitempty"`
	Message    string `json:"message"`
}

// NotifyHandler primește notificări de la Spring Boot și le difuzează prin WebSocket
func NotifyHandler(h *hub.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req NotifyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, fmt.Sprintf("Eroare parsare JSON: %v", err), http.StatusBadRequest)
			return
		}

		// Construim mesajul de notificare
		notification := hub.NotificationMessage{
			Type:      req.Type,
			RequestID: req.RequestID,
			Status:    req.Status,
			Message:   req.Message,
			Timestamp: time.Now().Format(time.RFC3339),
		}

		// Difuzăm la toți clienții conectați
		h.Broadcast(notification)

		log.Printf("Notificare difuzată: type=%s, requestId=%s, clients=%d",
			req.Type, req.RequestID, h.ClientCount())

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":         true,
			"clientsNotified": h.ClientCount(),
		})
	}
}

// HealthHandler returnează statusul serviciului
func HealthHandler(h *hub.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":           "UP",
			"service":          "CivicOS Notifications",
			"connectedClients": h.ClientCount(),
			"timestamp":        time.Now().Format(time.RFC3339),
		})
	}
}

