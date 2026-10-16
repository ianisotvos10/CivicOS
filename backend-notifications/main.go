package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"civicos/notifications/handlers"
	"civicos/notifications/hub"

	"github.com/rs/cors"
)

func main() {
	log.Println("╔══════════════════════════════════════════╗")
	log.Println("║   CivicOS — Notification Service (Go)    ║")
	log.Println("║   Real-time WebSocket Notifications       ║")
	log.Println("╚══════════════════════════════════════════╝")

	// Inițializăm hub-ul de WebSocket
	notificationHub := hub.NewHub()
	go notificationHub.Run()
	log.Println("✅ WebSocket Hub pornit")

	// Configurăm rutele HTTP
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", handlers.WebSocketHandler(notificationHub))
	mux.HandleFunc("/notify", handlers.NotifyHandler(notificationHub))
	mux.HandleFunc("/health", handlers.HealthHandler(notificationHub))

	// Configurăm middleware CORS pentru frontend (React: localhost:5173)
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})
	handler := c.Handler(mux)

	// Configurăm serverul HTTP
	port := os.Getenv("PORT")
	if port == "" {
		port = "9090"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	// Pornire graceful cu shutdown
	go func() {
		log.Printf("🚀 Server pornit pe portul %s", port)
		log.Printf("📡 WebSocket endpoint: ws://localhost:%s/ws", port)
		log.Printf("📬 Notify endpoint:    POST http://localhost:%s/notify", port)
		log.Printf("❤️  Health endpoint:   GET  http://localhost:%s/health", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Eroare server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("⏹️  Oprire graceful server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Eroare shutdown: %v", err)
	}
	log.Println("✅ Server oprit.")
}

