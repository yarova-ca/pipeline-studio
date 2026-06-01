package routes_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
	"github.com/yarova-ca/16-fiber/internal/db"
	"github.com/yarova-ca/16-fiber/internal/routes"
)

func newUsersApp(t *testing.T) (*fiber.App, *db.User) {
	t.Helper()
	database := newTestDB(t)
	app := fiber.New()
	routes.RegisterAuth(app)
	routes.RegisterUsers(app)

	user := seedUser(t, database, db.User{ID: "items-user-1", Email: "items@example.com", Name: "Items User", Provider: "github"})
	return app, &user
}

func authHeader(t *testing.T, user *db.User) string {
	t.Helper()
	return "Bearer " + signedToken(t, user.ID, user.Email, user.Name)
}

func TestListItems_NoAuth_Returns401(t *testing.T) {
	app, _ := newUsersApp(t)
	req := httptest.NewRequest(http.MethodGet, "/users/me/items", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestListItems_ValidJWT_Returns200(t *testing.T) {
	app, user := newUsersApp(t)
	req := httptest.NewRequest(http.MethodGet, "/users/me/items", nil)
	req.Header.Set("Authorization", authHeader(t, user))
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestCreateItem_MissingTitle_Returns400(t *testing.T) {
	app, user := newUsersApp(t)
	body := `{"description":"no title here"}`
	req := httptest.NewRequest(http.MethodPost, "/users/me/items", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", authHeader(t, user))
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestCreateItem_ValidJWT_Returns201(t *testing.T) {
	app, user := newUsersApp(t)
	body := `{"title":"My Item","description":"desc"}`
	req := httptest.NewRequest(http.MethodPost, "/users/me/items", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", authHeader(t, user))
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201, got %d", resp.StatusCode)
	}
	var item map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&item); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if item["title"] != "My Item" {
		t.Fatalf("unexpected title: %v", item["title"])
	}
}

func TestDeleteItem_NoAuth_Returns401(t *testing.T) {
	app, _ := newUsersApp(t)
	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/users/me/items/%s", "some-id"), nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestDeleteItem_NotFound_Returns404(t *testing.T) {
	app, user := newUsersApp(t)
	req := httptest.NewRequest(http.MethodDelete, "/users/me/items/nonexistent-id", nil)
	req.Header.Set("Authorization", authHeader(t, user))
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}
