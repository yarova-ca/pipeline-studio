package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/yarova-ca/16-chi/internal/db"
)

type contextKey string

const userContextKey contextKey = "user"

// RequireAuth is a chi middleware (func(http.Handler) http.Handler).
//
// Authentication order:
//  1. Authorization: Bearer <JWT> — verified via VerifyToken.
//  2. X-API-Key header — looked up in the users table.
//
// On success: stores *Claims in request context, calls next.
// On failure: writes 401 JSON response.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// --- Attempt 1: Bearer JWT ---
		if authHeader := r.Header.Get("Authorization"); authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
				claims, err := VerifyToken(parts[1])
				if err != nil {
					writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid token"})
					return
				}
				ctx := context.WithValue(r.Context(), userContextKey, claims)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
		}

		// --- Attempt 2: X-API-Key header ---
		if apiKey := r.Header.Get("X-API-Key"); apiKey != "" {
			database := db.GetDB()
			var user db.User
			result := database.Where("api_key = ?", apiKey).First(&user)
			if result.Error != nil {
				writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid api key"})
				return
			}
			claims := &Claims{UserID: user.ID, Email: user.Email, Name: user.Name}
			ctx := context.WithValue(r.Context(), userContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication required"})
	})
}

// GetClaims extracts the authenticated Claims from the request context.
func GetClaims(r *http.Request) *Claims {
	val := r.Context().Value(userContextKey)
	if val == nil {
		return nil
	}
	claims, _ := val.(*Claims)
	return claims
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
