package main

import (
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yarova-ca/16-gin/internal/db"
	"github.com/yarova-ca/16-gin/internal/routes"
	"golang.org/x/time/rate"
)

// rateLimiter is a token-bucket limiter shared across all requests.
// Allows 100 requests per minute per process (global, not per-IP).
// For per-IP limiting in production use a middleware like gin-contrib/ratelimit.
var rateLimiter = rate.NewLimiter(rate.Every(time.Minute/100), 100)

func main() {
	// JSON structured logging — stdlib slog, Go 1.21+.
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

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
	slog.Info("Gin server started", "port", port)
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

	// ── Request logging ────────────────────────────────────────────────────
	r.Use(func(c *gin.Context) {
		slog.Info("request",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"ip", c.ClientIP(),
		)
		c.Next()
	})

	// ── Rate limiting ──────────────────────────────────────────────────────
	// Health endpoints are exempt so k8s probes are never blocked.
	r.Use(func(c *gin.Context) {
		if len(c.Request.URL.Path) >= 7 && c.Request.URL.Path[:7] == "/health" {
			c.Next()
			return
		}
		if !rateLimiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests — try again in 60 seconds",
			})
			return
		}
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

	// DB-checking readiness probe.
	// Returns 503 when the database is unreachable so k8s removes the pod
	// from the load balancer until the connection recovers.
	r.GET("/health/ready", func(c *gin.Context) {
		if db.GetDBOrNil() == nil {
			// No database configured — treat as ready (dev mode).
			c.JSON(http.StatusOK, gin.H{"status": "ok", "db": "not configured"})
			return
		}
		if err := db.GetDB().Exec("SELECT 1").Error; err != nil {
			slog.Error("health/ready db check failed", "err", err)
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "db": "disconnected"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok", "db": "connected"})
	})

	// Auth and user routes.
	routes.RegisterAuth(r)
	routes.RegisterUsers(r)

	return r
}
