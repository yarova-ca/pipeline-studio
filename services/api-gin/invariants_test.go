package main

// invariants_test.go — Yarova platform invariant suite for service 16-gin.
//
// Each test maps to one platform invariant by I-id and proves the running
// app (the real *gin.Engine from buildRouter) upholds it via httptest.
//
// Invariants covered:
//   I-3  protected route, no Authorization header        -> 401
//   I-4  protected route, garbage/tampered Bearer token  -> 401
//   I-6  protected POST, valid token + unknown JSON field -> 400
//   I-10 GET /health/live                                 -> 200
//   I-13 GET /metrics  -> 200 + http_request_duration_seconds present
//   I-17 response carries X-Content-Type-Options: nosniff

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	ginauth "github.com/yarova-ca/16-gin/internal/auth"
	"github.com/yarova-ca/16-gin/internal/db"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// The real protected route used to prove auth invariants. /auth/me is mounted
// with ginauth.RequireAuth and exists in every mode.
const protectedGET = "/auth/me"

// The real protected POST route used to prove the unknown-field invariant.
const protectedPOST = "/users/me/items"

// setupInvariantDB injects an in-memory SQLite DB so protected handlers that
// reach the data layer (after passing auth + binding) do not panic. The auth
// and binding invariants short-circuit before the DB, but a real DB keeps the
// suite honest and lets the I-6 valid-token path execute end to end.
func setupInvariantDB(t *testing.T) {
	t.Helper()
	gdb, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("opening in-memory sqlite: %v", err)
	}
	if err := gdb.AutoMigrate(&db.User{}, &db.Item{}); err != nil {
		t.Fatalf("migrating in-memory sqlite: %v", err)
	}
	db.SetDB(gdb)
}

// mintValidToken signs a real JWT the exact way the middleware verifies it.
// JWT_SECRET is set in TestMain (main_test.go) for the whole package.
func mintValidToken(t *testing.T) string {
	t.Helper()
	tok, err := ginauth.SignToken("user-invariant", "invariant@yarova.ca", "Invariant User")
	if err != nil {
		t.Fatalf("signing valid token: %v", err)
	}
	return tok
}

// I-3: GET a protected route with NO Authorization header -> 401.
func TestInvariant_I3_ProtectedRoute_NoAuthHeader_Returns401(t *testing.T) {
	router := buildRouter()

	req := httptest.NewRequest(http.MethodGet, protectedGET, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("I-3: expected 401 with no Authorization header, got %d (body: %s)", w.Code, w.Body.String())
	}
}

// I-4: GET a protected route with a garbage/tampered Bearer token -> 401.
func TestInvariant_I4_ProtectedRoute_GarbageBearer_Returns401(t *testing.T) {
	router := buildRouter()

	req := httptest.NewRequest(http.MethodGet, protectedGET, nil)
	req.Header.Set("Authorization", "Bearer not.a.valid.jwt.eyJ0YW1wZXJlZCI6dHJ1ZX0")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("I-4: expected 401 with garbage bearer token, got %d (body: %s)", w.Code, w.Body.String())
	}
}

// I-4b: a structurally valid token re-signed with the wrong secret is rejected.
// Proves the signature is actually verified, not just the shape.
func TestInvariant_I4_ProtectedRoute_TamperedSignature_Returns401(t *testing.T) {
	router := buildRouter()

	valid := mintValidToken(t)
	// Flip the last char of the signature segment to tamper the signature.
	tampered := valid[:len(valid)-1]
	if strings.HasSuffix(valid, "a") {
		tampered += "b"
	} else {
		tampered += "a"
	}

	req := httptest.NewRequest(http.MethodGet, protectedGET, nil)
	req.Header.Set("Authorization", "Bearer "+tampered)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("I-4: expected 401 with tampered signature, got %d (body: %s)", w.Code, w.Body.String())
	}
}

// I-6: POST a protected route with a VALID token + an unknown extra JSON body
// field -> 400. Unknown fields must be rejected so clients cannot smuggle
// extra data past validation.
func TestInvariant_I6_ProtectedPOST_ValidToken_UnknownField_Returns400(t *testing.T) {
	setupInvariantDB(t)
	router := buildRouter()
	token := mintValidToken(t)

	// Valid title + an unknown field "is_admin" that the schema does not define.
	body := `{"title":"legit item","is_admin":true}`
	req := httptest.NewRequest(http.MethodPost, protectedPOST, strings.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("I-6: expected 400 for unknown JSON field with valid token, got %d (body: %s)", w.Code, w.Body.String())
	}
}

// I-6 control: the SAME route with a clean, known-only body must NOT be 400.
// Guards against the test passing because the route rejects everything.
func TestInvariant_I6_ProtectedPOST_ValidToken_CleanBody_NotRejected(t *testing.T) {
	setupInvariantDB(t)
	router := buildRouter()
	token := mintValidToken(t)

	body := `{"title":"legit item"}`
	req := httptest.NewRequest(http.MethodPost, protectedPOST, strings.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code == http.StatusBadRequest {
		t.Fatalf("I-6 control: clean body wrongly rejected as 400 (body: %s)", w.Body.String())
	}
	if w.Code == http.StatusUnauthorized {
		t.Fatalf("I-6 control: valid token wrongly rejected as 401 (body: %s)", w.Body.String())
	}
}

// I-10: GET /health/live -> 200.
func TestInvariant_I10_HealthLive_Returns200(t *testing.T) {
	router := buildRouter()

	req := httptest.NewRequest(http.MethodGet, "/health/live", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("I-10: expected 200 from /health/live, got %d", w.Code)
	}
}

// I-13: GET /metrics -> 200 and body contains the request-duration golden
// signal metric http_request_duration_seconds.
func TestInvariant_I13_Metrics_ExposesRequestDuration(t *testing.T) {
	router := buildRouter()

	// Fire one request first so the histogram has at least one series emitted.
	warm := httptest.NewRequest(http.MethodGet, "/health/live", nil)
	router.ServeHTTP(httptest.NewRecorder(), warm)

	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("I-13: expected 200 from /metrics, got %d", w.Code)
	}
	const goldenMetric = "http_request_duration_seconds"
	if !strings.Contains(w.Body.String(), goldenMetric) {
		t.Fatalf("I-13: /metrics body missing golden-signal metric %q", goldenMetric)
	}
}

// I-17: a response carries the security header X-Content-Type-Options: nosniff.
func TestInvariant_I17_ResponseHasNoSniffHeader(t *testing.T) {
	router := buildRouter()

	req := httptest.NewRequest(http.MethodGet, "/health/live", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	got := w.Header().Get("X-Content-Type-Options")
	if got != "nosniff" {
		t.Fatalf("I-17: expected X-Content-Type-Options: nosniff, got %q", got)
	}
}
