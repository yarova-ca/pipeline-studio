package active

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// RequireAuth is a Gin middleware that enforces JWT authentication.
//
// Authentication order:
//  1. Authorization: Bearer <JWT> header — verified via VerifyToken.
//
// On success: sets c.Set("user", *Claims) and calls c.Next().
// On failure: calls c.AbortWithStatusJSON(401, ...).
func RequireAuth(c *gin.Context) {
	// --- Attempt 1: Bearer JWT ---
	if authHeader := c.GetHeader("Authorization"); authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
			claims, err := VerifyToken(parts[1])
			if err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
				return
			}
			c.Set("user", claims)
			c.Next()
			return
		}
	}

	// --- No credentials provided ---
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
}

// GetClaims extracts the authenticated Claims from the Gin context.
// Returns nil when RequireAuth has not run or the value is the wrong type.
func GetClaims(c *gin.Context) *Claims {
	val, exists := c.Get("user")
	if !exists {
		return nil
	}
	claims, _ := val.(*Claims)
	return claims
}
