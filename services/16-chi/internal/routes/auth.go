package routes

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	chiauth "github.com/yarova-ca/16-chi/internal/auth"
	"github.com/yarova-ca/16-chi/internal/db"
)

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// RegisterAuth mounts all /auth and /dev routes on the provided router.
func RegisterAuth(r chi.Router) {
	r.Get("/auth/login", handleLogin)
	r.Get("/auth/callback", handleCallback)
	r.With(chiauth.RequireAuth).Get("/auth/me", handleMe)
	r.Post("/auth/logout", handleLogout)
	r.With(chiauth.RequireAuth).Post("/auth/api-key", handleGenerateAPIKey)
	r.With(chiauth.RequireAuth).Delete("/auth/api-key", handleRevokeAPIKey)

	if os.Getenv("APP_ENV") != "production" {
		r.Post("/dev/token", handleDevToken)
	}
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	clientID := os.Getenv("AUTH_CLIENT_ID")
	callbackURL := os.Getenv("AUTH_CALLBACK_URL")
	if clientID == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "OAuth not configured"})
		return
	}
	http.Redirect(w, r, fmt.Sprintf(
		"https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=user:email",
		clientID, callbackURL,
	), http.StatusFound)
}

func handleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing code parameter"})
		return
	}

	accessToken, err := exchangeGitHubCode(code)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "failed to exchange code"})
		return
	}

	ghUser, err := fetchGitHubUser(accessToken)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "failed to fetch user profile"})
		return
	}

	database := db.GetDB()
	user := db.User{Email: ghUser.Email, Name: ghUser.Name, Provider: "github"}
	result := database.Where(db.User{Email: ghUser.Email}).FirstOrCreate(&user)
	if result.Error != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "database error"})
		return
	}

	token, err := chiauth.SignToken(user.ID, user.Email, user.Name)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to sign token"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

func handleMe(w http.ResponseWriter, r *http.Request) {
	claims := chiauth.GetClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}

	database := db.GetDB()
	var user db.User
	if err := database.First(&user, "id = ?", claims.UserID).Error; err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "user not found"})
		return
	}

	writeJSON(w, http.StatusOK, user)
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func handleGenerateAPIKey(w http.ResponseWriter, r *http.Request) {
	claims := chiauth.GetClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}

	key, err := generateAPIKey()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to generate key"})
		return
	}

	database := db.GetDB()
	if err := database.Model(&db.User{}).Where("id = ?", claims.UserID).Update("api_key", key).Error; err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "database error"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"api_key": key})
}

func handleRevokeAPIKey(w http.ResponseWriter, r *http.Request) {
	claims := chiauth.GetClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}

	database := db.GetDB()
	if err := database.Model(&db.User{}).Where("id = ?", claims.UserID).Update("api_key", nil).Error; err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "database error"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func handleDevToken(w http.ResponseWriter, r *http.Request) {
	var body struct {
		UserID string `json:"user_id"`
		Email  string `json:"email"`
		Name   string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if body.UserID == "" || body.Email == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "user_id and email are required"})
		return
	}

	token, err := chiauth.SignToken(body.UserID, body.Email, body.Name)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to sign token"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

func generateAPIKey() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

type githubUser struct {
	Email string
	Name  string
}

func exchangeGitHubCode(code string) (string, error) {
	clientID := os.Getenv("AUTH_CLIENT_ID")
	clientSecret := os.Getenv("AUTH_CLIENT_SECRET")
	callbackURL := os.Getenv("AUTH_CALLBACK_URL")

	req, err := http.NewRequest(http.MethodPost, "https://github.com/login/oauth/access_token", nil)
	if err != nil {
		return "", err
	}
	q := req.URL.Query()
	q.Set("client_id", clientID)
	q.Set("client_secret", clientSecret)
	q.Set("code", code)
	q.Set("redirect_uri", callbackURL)
	req.URL.RawQuery = q.Encode()
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("posting to GitHub token endpoint: %w", err)
	}
	defer resp.Body.Close()

	var payload struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return "", err
	}
	if payload.Error != "" {
		return "", fmt.Errorf("GitHub error: %s", payload.Error)
	}
	return payload.AccessToken, nil
}

func fetchGitHubUser(accessToken string) (*githubUser, error) {
	req, err := http.NewRequest(http.MethodGet, "https://api.github.com/user", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var payload struct {
		Login string `json:"login"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, err
	}
	name := payload.Name
	if name == "" {
		name = payload.Login
	}
	email := payload.Email
	if email == "" {
		email = payload.Login + "@users.noreply.github.com"
	}
	return &githubUser{Email: email, Name: name}, nil
}
