package auth

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/yarova-ca/16-echo/internal/db"
)

// RequireAuth is an Echo middleware (func(echo.HandlerFunc) echo.HandlerFunc).
//
// Authentication order:
//  1. Authorization: Bearer <JWT> header — verified via VerifyToken.
//  2. X-API-Key header — looked up in the users table.
//
// On success: sets c.Set("user", *Claims) and calls next.
// On failure: returns 401 JSON response.
func RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// --- Attempt 1: Bearer JWT ---
		if authHeader := c.Request().Header.Get("Authorization"); authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
				claims, err := VerifyToken(parts[1])
				if err != nil {
					return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid token"})
				}
				c.Set("user", claims)
				return next(c)
			}
		}

		// --- Attempt 2: X-API-Key header ---
		if apiKey := c.Request().Header.Get("X-API-Key"); apiKey != "" {
			database := db.GetDB()
			var user db.User
			result := database.Where("api_key = ?", apiKey).First(&user)
			if result.Error != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid api key"})
			}
			claims := &Claims{UserID: user.ID, Email: user.Email, Name: user.Name}
			c.Set("user", claims)
			return next(c)
		}

		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "authentication required"})
	}
}

// GetClaims extracts the authenticated Claims from the Echo context.
func GetClaims(c echo.Context) *Claims {
	val := c.Get("user")
	if val == nil {
		return nil
	}
	claims, _ := val.(*Claims)
	return claims
}
