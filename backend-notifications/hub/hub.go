package hub

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// NotificationMessage este structura unui mesaj de notificare
type NotificationMessage struct {
	Type      string `json:"type"`
	RequestID string `json:"requestId,omitempty"`
	Status    string `json:"status,omitempty"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
}

// Hub menține setul de clienți activi și difuzează mesajele
type Hub struct {
	clients    map[*websocket.Conn]bool
	broadcast  chan NotificationMessage
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	mu         sync.RWMutex
}

// NewHub creează un nou Hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*websocket.Conn]bool),
		broadcast:  make(chan NotificationMessage, 256),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
	}
}

// Run pornește bucla principală a hub-ului
func (h *Hub) Run() {
	for {
		select {
		case conn := <-h.register:
			h.mu.Lock()
			h.clients[conn] = true
			h.mu.Unlock()
			log.Printf("Client conectat. Total clienți: %d", len(h.clients))

		case conn := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[conn]; ok {
				delete(h.clients, conn)
				conn.Close()
			}
			h.mu.Unlock()
			log.Printf("Client deconectat. Total clienți: %d", len(h.clients))

		case message := <-h.broadcast:
			msgBytes, err := json.Marshal(message)
			if err != nil {
				log.Printf("Eroare serializare mesaj: %v", err)
				continue
			}
			h.mu.Lock()
			for conn := range h.clients {
				err := conn.WriteMessage(websocket.TextMessage, msgBytes)
				if err != nil {
					log.Printf("Eroare scriere mesaj: %v", err)
					conn.Close()
					delete(h.clients, conn)
				}
			}
			h.mu.Unlock()
		}
	}
}

// Broadcast trimite un mesaj tuturor clienților conectați
func (h *Hub) Broadcast(msg NotificationMessage) {
	select {
	case h.broadcast <- msg:
	default:
		log.Println("Canalul de broadcast este plin, mesaj ignorat")
	}
}

// Register înregistrează un client nou
func (h *Hub) Register(conn *websocket.Conn) {
	h.register <- conn
}

// Unregister dezînregistrează un client
func (h *Hub) Unregister(conn *websocket.Conn) {
	h.unregister <- conn
}

// ClientCount returnează numărul de clienți conectați
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

