package hub

import (
	"testing"
	"time"
)

func TestHubLifecycle(t *testing.T) {
	h := NewHub()
	if h == nil {
		t.Fatal("NewHub returned nil")
	}

	go h.Run()

	if count := h.ClientCount(); count != 0 {
		t.Fatalf("Expected 0 clients initially, got %d", count)
	}

	// Test non-blocking broadcast with no clients
	h.Broadcast(NotificationMessage{
		Type:      "TEST",
		Message:   "Test broadcast with no clients",
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

