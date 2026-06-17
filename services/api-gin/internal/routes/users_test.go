package routes_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/yarova-ca/16-gin/internal/db"
	"github.com/yarova-ca/16-gin/internal/routes"
)

// newUsersRouter creates a fresh test DB and registers only the users routes.
func newUsersRouter(t *testing.T) (*gin.Engine, *db.User) {
	t.Helper()
	database := newTestDB(t)
	r := gin.New()
	routes.RegisterAuth(r)
	routes.RegisterUsers(r)

	user := seedUser(t, database, db.User{
		ID:       "items-user-1",
		Email:    "items@example.com",
		Name:     "Items User",
		Provider: "github",
	})
	return r, &user
}

// authHeader returns an Authorization header value for the given user.
func authHeader(t *testing.T, user *db.User) string {
	t.Helper()
	return "Bearer " + signedToken(t, user.ID, user.Email, user.Name)
}

// ---------------------------------------------------------------------------
// GET /users/me/items — list
// ---------------------------------------------------------------------------

func TestListItems_NoAuth_Returns401(t *testing.T) {
	r, _ := newUsersRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/users/me/items", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestListItems_BadJWT_Returns401(t *testing.T) {
	r, _ := newUsersRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/users/me/items", nil)
	req.Header.Set("Authorization", "Bearer invalid.jwt.here")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestListItems_ValidJWT_Returns200EmptySlice(t *testing.T) {
	r, user := newUsersRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/users/me/items", nil)
	req.Header.Set("Authorization", authHeader(t, user))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}

	// The list endpoint returns a pagination envelope:
	// {"items": [...], "total": N, "limit": N, "offset": N}.
	var resp struct {
		Items []interface{} `json:"items"`
		Total int64         `json:"total"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	// New user has no items — expect an empty array, not null.
	if resp.Items == nil {
		t.Fatal("expected an empty array, got null")
	}
	if len(resp.Items) != 0 {
		t.Fatalf("expected 0 items for new user, got %d", len(resp.Items))
	}
}

// ---------------------------------------------------------------------------
// POST /users/me/items — create
// ---------------------------------------------------------------------------

func TestCreateItem_NoAuth_Returns401(t *testing.T) {
	r, _ := newUsersRouter(t)
	body := `{"title":"My Item"}`
	req := httptest.NewRequest(http.MethodPost, "/users/me/items", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestCreateItem_MissingTitle_Returns400(t *testing.T) {
	r, user := newUsersRouter(t)
	body := `{"description":"no title here"}`
	req := httptest.NewRequest(http.MethodPost, "/users/me/items", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", authHeader(t, user))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCreateItem_ValidJWT_Returns201(t *testing.T) {
	r, user := newUsersRouter(t)
	body := `{"title":"My Item","description":"a description"}`
	req := httptest.NewRequest(http.MethodPost, "/users/me/items", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", authHeader(t, user))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

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
	if item["id"] == "" || item["id"] == nil {
		t.Fatal("expected id in response")
	}
}

// ---------------------------------------------------------------------------
// GET /users/me/items/:id — get single
// ---------------------------------------------------------------------------

func TestGetItem_ValidJWT_Returns200(t *testing.T) {
	database := newTestDB(t)
	r := gin.New()
	routes.RegisterUsers(r)

	user := seedUser(t, database, db.User{
		ID:       "getitem-user",
		Email:    "getitem@example.com",
		Name:     "GetItem User",
		Provider: "github",
	})

	item := db.Item{Title: "Seeded Item", UserID: user.ID}
	if err := database.Create(&item).Error; err != nil {
		t.Fatalf("seed item: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/users/me/items/"+item.ID, nil)
	req.Header.Set("Authorization", authHeader(t, &user))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}
}

func TestGetItem_WrongUser_Returns404(t *testing.T) {
	database := newTestDB(t)
	r := gin.New()
	routes.RegisterUsers(r)

	owner := seedUser(t, database, db.User{
		ID:       "owner-user",
		Email:    "owner@example.com",
		Name:     "Owner",
		Provider: "github",
	})
	other := seedUser(t, database, db.User{
		ID:       "other-user",
		Email:    "other@example.com",
		Name:     "Other",
		Provider: "github",
	})

	item := db.Item{Title: "Owner Item", UserID: owner.ID}
	if err := database.Create(&item).Error; err != nil {
		t.Fatalf("seed item: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/users/me/items/"+item.ID, nil)
	req.Header.Set("Authorization", authHeader(t, &other))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for wrong user, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// PUT /users/me/items/:id — update
// ---------------------------------------------------------------------------

func TestUpdateItem_ValidJWT_Returns200(t *testing.T) {
	database := newTestDB(t)
	r := gin.New()
	routes.RegisterUsers(r)

	user := seedUser(t, database, db.User{
		ID:       "update-user",
		Email:    "update@example.com",
		Name:     "Update User",
		Provider: "github",
	})

	item := db.Item{Title: "Before", UserID: user.ID}
	if err := database.Create(&item).Error; err != nil {
		t.Fatalf("seed item: %v", err)
	}

	body := `{"title":"After"}`
	req := httptest.NewRequest(http.MethodPut, "/users/me/items/"+item.ID, bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", authHeader(t, &user))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}
}

func TestUpdateItem_BadJWT_Returns401(t *testing.T) {
	r, _ := newUsersRouter(t)
	req := httptest.NewRequest(http.MethodPut, "/users/me/items/any-id", bytes.NewBufferString(`{"title":"x"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer bad.jwt.token")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// DELETE /users/me/items/:id — delete
// ---------------------------------------------------------------------------

func TestDeleteItem_ValidJWT_Returns204(t *testing.T) {
	database := newTestDB(t)
	r := gin.New()
	routes.RegisterUsers(r)

	user := seedUser(t, database, db.User{
		ID:       "delete-user",
		Email:    "delete@example.com",
		Name:     "Delete User",
		Provider: "github",
	})

	item := db.Item{Title: "To Delete", UserID: user.ID}
	if err := database.Create(&item).Error; err != nil {
		t.Fatalf("seed item: %v", err)
	}

	req := httptest.NewRequest(http.MethodDelete, "/users/me/items/"+item.ID, nil)
	req.Header.Set("Authorization", authHeader(t, &user))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d — body: %s", w.Code, w.Body.String())
	}
}

func TestDeleteItem_NoAuth_Returns401(t *testing.T) {
	r, _ := newUsersRouter(t)
	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/users/me/items/%s", "some-id"), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestDeleteItem_NotFound_Returns404(t *testing.T) {
	r, user := newUsersRouter(t)
	req := httptest.NewRequest(http.MethodDelete, "/users/me/items/nonexistent-id", nil)
	req.Header.Set("Authorization", authHeader(t, user))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// API Key auth on items routes
// ---------------------------------------------------------------------------

func TestListItems_ValidAPIKey_Returns200(t *testing.T) {
	database := newTestDB(t)
	r := gin.New()
	routes.RegisterUsers(r)

	apiKey := "items-api-key-xyz"
	user := seedUser(t, database, db.User{
		ID:       "apikey-items-user",
		Email:    "apikeyitems@example.com",
		Name:     "API Key Items",
		Provider: "github",
		APIKey:   &apiKey,
	})
	_ = user

	req := httptest.NewRequest(http.MethodGet, "/users/me/items", nil)
	req.Header.Set("X-API-Key", apiKey)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}
}
