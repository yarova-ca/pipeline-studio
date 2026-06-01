package routes_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gofiber/fiber/v3"
	fiberauth "github.com/yarova-ca/16-fiber/internal/auth"
	"github.com/yarova-ca/16-fiber/internal/db"
	"github.com/yarova-ca/16-fiber/internal/routes"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	database, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test db: %v", err)
	}
	if err := database.AutoMigrate(&db.User{}, &db.Item{}); err != nil {
		t.Fatalf("migrate test db: %v", err)
	}
	db.SetDB(database)
	return database
}

func newTestApp(t *testing.T) *fiber.App {
	t.Helper()
	newTestDB(t)
	app := fiber.New()
	routes.RegisterAuth(app)
	routes.RegisterUsers(app)
	return app
}

func signedToken(t *testing.T, userID, email, name string) string {
	t.Helper()
	tok, err := fiberauth.SignToken(userID, email, name)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return tok
}

func seedUser(t *testing.T, database *gorm.DB, u db.User) db.User {
	t.Helper()
	if err := database.Create(&u).Error; err != nil {
		t.Fatalf("seed user: %v", err)
	}
	return u
}

func TestMain(m *testing.M) {
	os.Setenv("JWT_SECRET", "test-secret-that-is-at-least-32-chars-long")
	os.Exit(m.Run())
}

func TestAuthMe_NoAuth_Returns401(t *testing.T) {
	app := newTestApp(t)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestAuthMe_BadJWT_Returns401(t *testing.T) {
	app := newTestApp(t)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("Authorization", "Bearer not-a-real-jwt")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestAuthMe_ValidJWT_Returns200(t *testing.T) {
	database := newTestDB(t)
	app := fiber.New()
	routes.RegisterAuth(app)

	user := seedUser(t, database, db.User{ID: "user-1", Email: "test@example.com", Name: "Test User", Provider: "github"})

	tok := signedToken(t, user.ID, user.Email, user.Name)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestAuthMe_ValidAPIKey_Returns200(t *testing.T) {
	database := newTestDB(t)
	app := fiber.New()
	routes.RegisterAuth(app)

	apiKey := "test-api-key-abc123"
	seedUser(t, database, db.User{ID: "user-2", Email: "apikey@example.com", Name: "API Key User", Provider: "github", APIKey: &apiKey})

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("X-API-Key", apiKey)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestAuthMe_BadAPIKey_Returns401(t *testing.T) {
	app := newTestApp(t)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("X-API-Key", "does-not-exist")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestDevToken_IssuesJWT(t *testing.T) {
	os.Unsetenv("APP_ENV")
	app := fiber.New()
	routes.RegisterAuth(app)

	body := `{"user_id":"u1","email":"dev@example.com","name":"Dev"}`
	req := httptest.NewRequest(http.MethodPost, "/dev/token", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if result["token"] == "" {
		t.Fatal("expected a token in response")
	}
	claims, err := fiberauth.VerifyToken(result["token"])
	if err != nil {
		t.Fatalf("issued token did not verify: %v", err)
	}
	if claims.UserID != "u1" {
		t.Fatalf("unexpected user_id: %s", claims.UserID)
	}
}

func TestLogout_Returns200(t *testing.T) {
	app := newTestApp(t)
	req := httptest.NewRequest(http.MethodPost, "/auth/logout", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}
