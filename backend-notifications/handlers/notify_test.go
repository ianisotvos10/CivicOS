package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"civicos/notifications/hub"

	"github.com/gorilla/websocket"
)

func TestHealthHandler(t *testing.T) {
	h := hub.NewHub()
	go h.Run()

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()

	handler := HealthHandler(h)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Fatalf("HealthHandler returned status code %d, expected %d", status, http.StatusOK)
	}

	var res map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &res); err != nil {
		t.Fatalf("Failed to parse JSON response: %v", err)
	}

	if res["status"] != "UP" {
		t.Errorf("Expected status 'UP', got %v", res["status"])
	}
	if res["service"] != "CivicOS Notifications" {
		t.Errorf("Expected service 'CivicOS Notifications', got %v", res["service"])
	}
}

func TestNotifyHandler(t *testing.T) {
	h := hub.NewHub()
	go h.Run()

	t.Run("Method Not Allowed on GET", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/notify", nil)
		rr := httptest.NewRecorder()

		handler := NotifyHandler(h)
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusMethodNotAllowed {
			t.Errorf("Expected status 405 Method Not Allowed, got %d", rr.Code)
		}
	})

	t.Run("Invalid JSON Body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/notify", bytes.NewBufferString("invalid json"))
		rr := httptest.NewRecorder()

		handler := NotifyHandler(h)
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400 Bad Request, got %d", rr.Code)
		}
	})

	t.Run("Valid Notification POST", func(t *testing.T) {
		body := `{"type":"STATUS_UPDATE","requestId":"REQ-101","status":"REZOLVATA","message":"Cererea ta a fost rezolvată!"}`
		req := httptest.NewRequest(http.MethodPost, "/notify", bytes.NewBufferString(body))
		rr := httptest.NewRecorder()

		handler := NotifyHandler(h)
		handler.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("Expected status 200 OK, got %d", rr.Code)
		}

		var res map[string]interface{}
		if err := json.Unmarshal(rr.Body.Bytes(), &res); err != nil {
			t.Fatalf("Failed to parse response: %v", err)
		}

		if res["success"] != true {
			t.Errorf("Expected success to be true, got %v", res["success"])
		}
	})
}

func TestWebSocketAndNotifyIntegration(t *testing.T) {
	h := hub.NewHub()
	go h.Run()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/ws") {
			WebSocketHandler(h)(w, r)
		} else if strings.HasPrefix(r.URL.Path, "/notify") {
			NotifyHandler(h)(w, r)
		}
	}))
	defer server.Close()

	// Convert http:// to ws://
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws"

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("WebSocket connection failed: %v", err)
	}
	defer conn.Close()

	// 1. Read welcome message
	conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	var welcome hub.NotificationMessage
	if err := conn.ReadJSON(&welcome); err != nil {
		t.Fatalf("Failed to read welcome message: %v", err)
	}
	if welcome.Type != "CONNECTED" {
		t.Errorf("Expected CONNECTED type, got %s", welcome.Type)
	}

	// Verify client is registered
	time.Sleep(50 * time.Millisecond)
	if count := h.ClientCount(); count != 1 {
		t.Fatalf("Expected 1 client registered, got %d", count)
	}

	// 2. Trigger notification via HTTP POST
	notifyBody := `{"type":"TEST_ALERT","requestId":"REQ-999","status":"URGENT","message":"Test alerta civic"}`
	resp, err := http.Post(server.URL+"/notify", "application/json", strings.NewReader(notifyBody))
	if err != nil {
		t.Fatalf("POST /notify failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("POST /notify returned status %d", resp.StatusCode)
	}

	// 3. Read broadcast notification from WebSocket
	conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	var notif hub.NotificationMessage
	if err := conn.ReadJSON(&notif); err != nil {
		t.Fatalf("Failed to read broadcast notification: %v", err)
	}

	if notif.Type != "TEST_ALERT" || notif.RequestID != "REQ-999" || notif.Status != "URGENT" {
		t.Errorf("Unexpected notification content: %+v", notif)
	}
}

