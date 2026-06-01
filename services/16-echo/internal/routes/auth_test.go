package routes_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/labstack/echo/v4"
	echoauth "github.com/yarova-ca/16-echo/internal/auth"
	"github.com/yarova-ca/16-echo/internal/db"
	"github.com/yarova-ca/16-echo/internal/routes"
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

func newTestEcho(t *testing.T) *echo.Echo {
	t.Helper()
	newTestDB(t)
	e := echo.New()
	routes.RegisterAuth(e)
	routes.RegisterUsers(e)
	return e
}

func signedToken(t *testing.T, userID, email, name string) string {
	t.Helper()
	tok, err := echoauth.SignToken(userID, email, name)
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
	e := newTestEcho(t)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuthMe_BadJWT_Returns401(t *testing.T) {
	e := newTestEcho(t)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("Authorization", "Bearer not-a-real-jwt")
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuthMe_ValidJWT_Returns200(t *testing.T) {
	database := newTestDB(t)
	e := echo.New()
	routes.RegisterAuth(e)

	user := seedUser(t, database, db.User{ID: "user-1", Email: "test@example.com", Name: "Test User", Provider: "github"})

	tok := signedToken(t, user.ID, user.Email, user.Name)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}
}

func TestAuthMe_ValidAPIKey_Returns200(t *testing.T) {
	database := newTestDB(t)
	e := echo.New()
	routes.RegisterAuth(e)

	apiKey := "test-api-key-abc123"
	seedUser(t, database, db.User{ID: "user-2", Email: "apikey@example.com", Name: "API Key User", Provider: "github", APIKey: &apiKey})

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("X-API-Key", apiKey)
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}
}

func TestAuthMe_BadAPIKey_Returns401(t *testing.T) {
	e := newTestEcho(t)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("X-API-Key", "does-not-exist")
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestDevToken_IssuesJWT(t *testing.T) {
	os.Unsetenv("APP_ENV")
	e := echo.New()
	routes.RegisterAuth(e)

	body := `{"user_id":"u1","email":"dev@example.com","name":"Dev"}`
	req := httptest.NewRequest(http.MethodPost, "/dev/token", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}

	var resp map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp["token"] == "" {
		t.Fatal("expected a token in response")
	}
	claims, err := echoauth.VerifyToken(resp["token"])
	if err != nil {
		t.Fatalf("issued token did not verify: %v", err)
	}
	if claims.UserID != "u1" {
		t.Fatalf("unexpected user_id: %s", claims.UserID)
	}
}

func TestLogout_Returns200(t *testing.T) {
	e := newTestEcho(t)
	req := httptest.NewRequest(http.MethodPost, "/auth/logout", nil)
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}
