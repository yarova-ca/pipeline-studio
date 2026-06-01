package auth

// WebSocket auth — validates auth on the HTTP upgrade request.
//
// WebSocket clients cannot set custom headers in the browser WebSocket API.
// Two auth paths are supported:
//
//   1. Authorization: Bearer <JWT> in the upgrade headers (server clients).
//   2. ?token=<JWT> query parameter in the WebSocket URL (browser clients).
//
// On valid auth: returns *Claims. Caller attaches to connection state.
// On missing or invalid auth: returns nil. Caller closes with 1008 Policy Violation.

import (
	"net/http"
	"strings"
)

// AuthenticateUpgrade extracts and verifies auth from a WebSocket upgrade request.
// Returns the Claims on success.
// Returns nil on auth failure.
func AuthenticateUpgrade(r *http.Request) *Claims {
	// --- Attempt 1: Authorization header (server-side clients) ---
	if authHeader := r.Header.Get("Authorization"); authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
			claims, err := VerifyToken(parts[1])
			if err == nil {
				return claims
			}
		}
	}

	// --- Attempt 2: ?token= query parameter (browser clients) ---
	if tokenParam := r.URL.Query().Get("token"); tokenParam != "" {
		claims, err := VerifyToken(tokenParam)
		if err == nil {
			return claims
		}
	}

	return nil
}
