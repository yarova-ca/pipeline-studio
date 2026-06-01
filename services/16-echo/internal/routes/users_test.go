package routes_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/yarova-ca/16-echo/internal/db"
	"github.com/yarova-ca/16-echo/internal/routes"
)

func newUsersEcho(t *testing.T) (*echo.Echo, *db.User) {
	t.Helper()
	database := newTestDB(t)
	e := echo.New()
	routes.RegisterAuth(e)
	routes.RegisterUsers(e)

	user := seedUser(t, database, db.User{ID: "items-user-1", Email: "items@example.com", Name: "Items User", Provider: "github"})
	return e, &user
}

func authHeader(t *testing.T, user *db.User) string {
	t.Helper()
	return "Bearer " + signedToken(t, user.ID, user.Email, user.Name)
}

func TestListItems_NoAuth_Returns401(t *testing.T) {
	e, _ := newUsersEcho(t)
	req := httptest.NewRequest(http.MethodGet, "/users/me/items", nil)
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestListItems_ValidJWT_Returns200(t *testing.T) {
	e, user := newUsersEcho(t)
	req := httptest.NewRequest(http.MethodGet, "/users/me/items", nil)
	req.Header.Set("Authorization", authHeader(t, user))
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}
}

func TestCreateItem_MissingTitle_Returns400(t *testing.T) {
	e, user := newUsersEcho(t)
	body := `{"description":"no title here"}`
	req := httptest.NewRequest(http.MethodPost, "/users/me/items", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", authHeader(t, user))
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCreateItem_ValidJWT_Returns201(t *testing.T) {
	e, user := newUsersEcho(t)
	body := `{"title":"My Item","description":"desc"}`
	req := httptest.NewRequest(http.MethodPost, "/users/me/items", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", authHeader(t, user))
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d — body: %s", w.Code, w.Body.String())
	}
	var item map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &item); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if item["title"] != "My Item" {
		t.Fatalf("unexpected title: %v", item["title"])
	}
}

func TestDeleteItem_NotFound_Returns404(t *testing.T) {
	e, user := newUsersEcho(t)
	req := httptest.NewRequest(http.MethodDelete, "/users/me/items/nonexistent-id", nil)
	req.Header.Set("Authorization", authHeader(t, user))
	w := httptest.NewRecorder()
	e.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}
