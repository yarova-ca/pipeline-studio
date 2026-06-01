package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/websocket"
)

func TestHealth(t *testing.T) {
	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	healthHandler(w, req)
	if w.Code != 200 { t.Errorf("expected 200, got %d", w.Code) }
}

func TestWebSocket(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(wsHandler))
	defer s.Close()
	u := "ws" + strings.TrimPrefix(s.URL, "http") + "/ws"
	c, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil { t.Fatal(err) }
	defer c.Close()
}
