package routes_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	ginauth "github.com/yarova-ca/16-gin/internal/auth"
	"github.com/yarova-ca/16-gin/internal/db"
	"github.com/yarova-ca/16-gin/internal/routes"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// newTestDB opens an in-memory SQLite database and auto-migrates the schema.
// It injects the instance via db.SetDB so handlers use it without hitting Postgres.
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

// newTestRouter wires the same routes as main.go using a freshly seeded test DB.
func newTestRouter(t *testing.T) *gin.Engine {
	t.Helper()
	newTestDB(t)
	r := gin.New()
	routes.RegisterAuth(r)
	routes.RegisterUsers(r)
	return r
}

// signedToken generates a real JWT for the given user fields.
func signedToken(t *testing.T, userID, email, name string) string {
	t.Helper()
	tok, err := ginauth.SignToken(userID, email, name)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return tok
}

// seedUser inserts a user into the test DB and returns it.
func seedUser(t *testing.T, database *gorm.DB, u db.User) db.User {
	t.Helper()
	if err := database.Create(&u).Error; err != nil {
		t.Fatalf("seed user: %v", err)
	}
	return u
}

// TestSetup ensures JWT_SECRET is set for every test in this file.
func TestMain(m *testing.M) {
	os.Setenv("JWT_SECRET", "test-secret-that-is-at-least-32-chars-long")
	os.Exit(m.Run())
}

// ---------------------------------------------------------------------------
// /auth/me
// ---------------------------------------------------------------------------

func TestAuthMe_NoAuth_Returns401(t *testing.T) {
	r := newTestRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuthMe_BadJWT_Returns401(t *testing.T) {
	r := newTestRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("Authorization", "Bearer not-a-real-jwt")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuthMe_ValidJWT_Returns200(t *testing.T) {
	database := newTestDB(t)
	r := gin.New()
	routes.RegisterAuth(r)

	user := seedUser(t, database, db.User{
		ID:       "user-1",
		Email:    "test@example.com",
		Name:     "Test User",
		Provider: "github",
	})

	tok := signedToken(t, user.ID, user.Email, user.Name)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp["email"] != "test@example.com" {
		t.Fatalf("unexpected email: %v", resp["email"])
	}
}

func TestAuthMe_ValidAPIKey_Returns200(t *testing.T) {
	database := newTestDB(t)
	r := gin.New()
	routes.RegisterAuth(r)

	apiKey := "test-api-key-abc123"
	user := seedUser(t, database, db.User{
		ID:       "user-2",
		Email:    "apikey@example.com",
		Name:     "API Key User",
		Provider: "github",
		APIKey:   &apiKey,
	})

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("X-API-Key", apiKey)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp["id"] != user.ID {
		t.Fatalf("unexpected id: %v", resp["id"])
	}
}

func TestAuthMe_BadAPIKey_Returns401(t *testing.T) {
	r := newTestRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("X-API-Key", "does-not-exist")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// /dev/token
// ---------------------------------------------------------------------------

func TestDevToken_IssuesJWT(t *testing.T) {
	// GIN_MODE must not be "release" for this endpoint to be registered.
	os.Unsetenv("GIN_MODE")
	r := gin.New()
	routes.RegisterAuth(r)

	body := `{"user_id":"u1","email":"dev@example.com","name":"Dev"}`
	req := httptest.NewRequest(http.MethodPost, "/dev/token", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}

	var resp map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp["token"] == "" {
		t.Fatal("expected a token in response, got empty string")
	}

	// Verify the issued token is valid.
	claims, err := ginauth.VerifyToken(resp["token"])
	if err != nil {
		t.Fatalf("issued token did not verify: %v", err)
	}
	if claims.UserID != "u1" {
		t.Fatalf("unexpected user_id in claims: %s", claims.UserID)
	}
}

func TestDevToken_MissingFields_Returns400(t *testing.T) {
	os.Unsetenv("GIN_MODE")
	r := gin.New()
	routes.RegisterAuth(r)

	body := `{"name":"Only Name"}`
	req := httptest.NewRequest(http.MethodPost, "/dev/token", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// /auth/api-key
// ---------------------------------------------------------------------------

func TestGenerateAPIKey_ValidJWT_Returns200WithKey(t *testing.T) {
	database := newTestDB(t)
	r := gin.New()
	routes.RegisterAuth(r)

	user := seedUser(t, database, db.User{
		ID:       "user-3",
		Email:    "genkey@example.com",
		Name:     "Gen Key User",
		Provider: "github",
	})

	tok := signedToken(t, user.ID, user.Email, user.Name)
	req := httptest.NewRequest(http.MethodPost, "/auth/api-key", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}

	var resp map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp["api_key"] == "" {
		t.Fatal("expected api_key in response")
	}
}

func TestRevokeAPIKey_ValidJWT_Returns200(t *testing.T) {
	database := newTestDB(t)
	r := gin.New()
	routes.RegisterAuth(r)

	apiKey := "to-revoke-key"
	user := seedUser(t, database, db.User{
		ID:       "user-4",
		Email:    "revoke@example.com",
		Name:     "Revoke User",
		Provider: "github",
		APIKey:   &apiKey,
	})

	tok := signedToken(t, user.ID, user.Email, user.Name)
	req := httptest.NewRequest(http.MethodDelete, "/auth/api-key", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}
}

// ---------------------------------------------------------------------------
// /auth/logout
// ---------------------------------------------------------------------------

func TestLogout_Returns200(t *testing.T) {
	r := newTestRouter(t)
	req := httptest.NewRequest(http.MethodPost, "/auth/logout", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}
