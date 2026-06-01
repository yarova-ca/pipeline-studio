package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/yarova-ca/16-gin/internal/db"
	"github.com/yarova-ca/16-gin/internal/routes"
)

func main() {
	// Connect to the database when DATABASE_URL is set.
	// Skip silently in environments that have not configured a database
	// (e.g. the health-only dev mode).
	if os.Getenv("DATABASE_URL") != "" {
		if err := db.InitDB(); err != nil {
			log.Fatalf("db init: %v", err)
		}
	}

	r := buildRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

// buildRouter constructs and returns the Gin engine with all routes registered.
// Extracted so tests can call it without starting a real listener.
func buildRouter() *gin.Engine {
	r := gin.Default()

	// Ensure every response carries application/json content-type.
	r.Use(func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.Next()
	})

	// Core health endpoints.
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message":   "Hello from Gin 1.10",
			"framework": "16-gin",
			"version":   "1.0.0",
		})
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "version": "1.0.0"})
	})

	r.GET("/health/live", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/health/ready", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Auth and user routes.
	routes.RegisterAuth(r)
	routes.RegisterUsers(r)

	return r
}
