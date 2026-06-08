package main

import (
	"log"
	"log/slog"
	"os"

	"github.com/gofiber/fiber/v3"
	"github.com/yarova-ca/16-fiber/internal/db"
	"github.com/yarova-ca/16-fiber/internal/routes"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	if os.Getenv("DATABASE_URL") != "" {
		if err := db.InitDB(); err != nil {
			log.Fatalf("db init: %v", err)
		}
	}

	app := buildApp()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func buildApp() *fiber.App {
	app := fiber.New()

	app.Get("/", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Hello from Fiber 3.0", "framework": "16-fiber", "version": "1.0.0"})
	})
	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "version": "1.0.0"})
	})
	app.Get("/health/live", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
	app.Get("/health/ready", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// ── Feature routes ─────────────────────────────────────────────────────
	routes.RegisterAuth(app)
	routes.RegisterUsers(app)

	return app
}
