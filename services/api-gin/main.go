package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/yarova-ca/16-gin/internal/compliance"
	"github.com/yarova-ca/16-gin/internal/db"
	"github.com/yarova-ca/16-gin/internal/metrics"
	"github.com/yarova-ca/16-gin/internal/routes"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"golang.org/x/time/rate"
)

// getEnvOrDefault returns the environment variable value or a fallback default.
func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// SecurityHeaders adds hardening response headers to every reply.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	}
}

// RequestID propagates or generates an X-Request-ID header on every request.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader("X-Request-ID")
		if id == "" {
			id = uuid.New().String()
		}
		c.Set("request_id", id)
		c.Header("X-Request-ID", id)
		c.Next()
	}
}

// rateLimiter is a token-bucket limiter shared across all requests.
// Allows 100 requests per minute per process (global, not per-IP).
// For per-IP limiting in production use a middleware like gin-contrib/ratelimit.
var rateLimiter = rate.NewLimiter(rate.Every(time.Minute/100), 100)

// initOTel initialises the OTLP trace exporter when OTEL_ENABLED=true.
// Returns a no-op shutdown func when OTel is disabled so callers are uniform.
func initOTel(ctx context.Context) func(context.Context) error {
	if os.Getenv("OTEL_ENABLED") != "true" {
		return func(context.Context) error { return nil }
	}
	exp, err := otlptracegrpc.New(ctx)
	if err != nil {
		log.Printf("otel exporter init failed (non-fatal): %v", err)
		return func(context.Context) error { return nil }
	}
	res, _ := resource.New(ctx,
		resource.WithAttributes(attribute.String("service.name", "16-gin")),
	)
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exp),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)
	slog.Info("otel enabled", "endpoint", os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT"))
	return tp.Shutdown
}

func main() {
	// I-1: fail fast on missing or weak required config.
	if len(os.Getenv("JWT_SECRET")) < 32 {
		log.Fatal("FATAL: JWT_SECRET must be set and at least 32 characters")
	}

	// JSON structured logging — stdlib slog, Go 1.21+.
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	// OpenTelemetry — guarded by OTEL_ENABLED=true.
	ctx := context.Background()
	shutdown := initOTel(ctx)
	defer shutdown(ctx) //nolint:errcheck

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

	// ── CORS ───────────────────────────────────────────────────────────────
	r.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Split(getEnvOrDefault("CORS_ORIGIN", "http://localhost:3000"), ","),
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization", "X-API-Key", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ── Security headers ───────────────────────────────────────────────────
	r.Use(SecurityHeaders())
	r.Use(metrics.Middleware())

	// ── Request ID ─────────────────────────────────────────────────────────
	r.Use(RequestID())

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

	r.GET("/metrics", metrics.Handler())

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

	// The active industry profile and the controls in effect. Switch with
	// COMPLIANCE_PROFILE — the controls flip at boot, no rebuild.
	r.GET("/compliance", func(c *gin.Context) {
		a := compliance.Active
		c.JSON(http.StatusOK, gin.H{
			"profile":      a.Profile,
			"name":         a.Name,
			"jurisdiction": a.Jurisdiction,
			"controls":     a.Controls,
		})
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

	// OpenAPI docs — served from docs/swagger.json.
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return r
}
