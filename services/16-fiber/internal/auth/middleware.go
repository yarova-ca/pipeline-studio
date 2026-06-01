package auth

import (
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/yarova-ca/16-fiber/internal/db"
)

// RequireAuth is a Fiber middleware (func(c fiber.Ctx) error).
//
// Authentication order:
//  1. Authorization: Bearer <JWT> header — verified via VerifyToken.
//  2. X-API-Key header — looked up in the users table.
//
// On success: stores *Claims in c.Locals("user"), calls c.Next().
// On failure: returns 401 JSON response.
func RequireAuth(c fiber.Ctx) error {
	// --- Attempt 1: Bearer JWT ---
	if authHeader := c.Get("Authorization"); authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
			claims, err := VerifyToken(parts[1])
			if err != nil {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
			}
			c.Locals("user", claims)
			return c.Next()
		}
	}

	// --- Attempt 2: X-API-Key header ---
	if apiKey := c.Get("X-API-Key"); apiKey != "" {
		database := db.GetDB()
		var user db.User
		result := database.Where("api_key = ?", apiKey).First(&user)
		if result.Error != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid api key"})
		}
		claims := &Claims{UserID: user.ID, Email: user.Email, Name: user.Name}
		c.Locals("user", claims)
		return c.Next()
	}

	return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "authentication required"})
}

// GetClaims extracts the authenticated Claims from the Fiber context.
func GetClaims(c fiber.Ctx) *Claims {
	val := c.Locals("user")
	if val == nil {
		return nil
	}
	claims, _ := val.(*Claims)
	return claims
}
