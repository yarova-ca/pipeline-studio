package main

import (
	"log"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil { log.Printf("upgrade: %v", err); return }
	defer conn.Close()

	for {
		mt, msg, err := conn.ReadMessage()
		if err != nil { break }
		conn.WriteMessage(mt, []byte(`{"echo":"`+string(msg)+`","ts":`+strconv.FormatInt(time.Now().UnixMilli(), 10)+`}`))
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok","version":"1.0.0"}`))
}

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	port := os.Getenv("PORT")
	if port == "" { port = "8080" }

	http.HandleFunc("/ws", wsHandler)
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/health/live", healthHandler)
	http.HandleFunc("/health/ready", healthHandler)

	log.Printf("WebSocket server on ws://localhost:%s/ws", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
