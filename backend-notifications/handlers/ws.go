package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"civicos/notifications/hub"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Permite conexiuni de la frontend-ul React (localhost:5173)
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:5173" || origin == "http://127.0.0.1:5173" || origin == ""
	},
}

// WebSocketHandler gestionează conexiunile WebSocket de la frontend
func WebSocketHandler(h *hub.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("Eroare upgrade WebSocket: %v", err)
			return
		}

		h.Register(conn)

		// Trimite mesaj de bun venit
		welcome := hub.NotificationMessage{
			Type:      "CONNECTED",
			Message:   "Conectat la sistemul de notificări CivicOS",
			Timestamp: time.Now().Format(time.RFC3339),
		}
		welcomeBytes, _ := json.Marshal(welcome)
		conn.WriteMessage(websocket.TextMessage, welcomeBytes)

		// Menține conexiunea deschisă și gestionează deconectarea
		defer func() {
			h.Unregister(conn)
		}()

		for {
			// Citim mesaje de la client (ping/pong)
			_, _, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("Eroare WebSocket: %v", err)
				}
				break
			}
		}
	}
}

