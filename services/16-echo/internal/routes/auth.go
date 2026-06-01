package routes

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	echoauth "github.com/yarova-ca/16-echo/internal/auth"
	"github.com/yarova-ca/16-echo/internal/db"
)

// RegisterAuth mounts all /auth and /dev routes on the provided Echo instance.
func RegisterAuth(e *echo.Echo) {
	e.GET("/auth/login", handleLogin)
	e.GET("/auth/callback", handleCallback)
	e.GET("/auth/me", handleMe, echoauth.RequireAuth)
	e.POST("/auth/logout", handleLogout)
	e.POST("/auth/api-key", handleGenerateAPIKey, echoauth.RequireAuth)
	e.DELETE("/auth/api-key", handleRevokeAPIKey, echoauth.RequireAuth)

	if os.Getenv("APP_ENV") != "production" {
		e.POST("/dev/token", handleDevToken)
	}
}

func handleLogin(c echo.Context) error {
	clientID := os.Getenv("AUTH_CLIENT_ID")
	callbackURL := os.Getenv("AUTH_CALLBACK_URL")
	if clientID == "" {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "OAuth not configured"})
	}
	return c.Redirect(http.StatusFound, fmt.Sprintf(
		"https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=user:email",
		clientID, callbackURL,
	))
}

func handleCallback(c echo.Context) error {
	code := c.QueryParam("code")
	if code == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing code parameter"})
	}

	accessToken, err := exchangeGitHubCode(code)
	if err != nil {
		return c.JSON(http.StatusBadGateway, map[string]string{"error": "failed to exchange code"})
	}

	ghUser, err := fetchGitHubUser(accessToken)
	if err != nil {
		return c.JSON(http.StatusBadGateway, map[string]string{"error": "failed to fetch user profile"})
	}

	database := db.GetDB()
	user := db.User{Email: ghUser.Email, Name: ghUser.Name, Provider: "github"}
	result := database.Where(db.User{Email: ghUser.Email}).FirstOrCreate(&user)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "database error"})
	}

	token, err := echoauth.SignToken(user.ID, user.Email, user.Name)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to sign token"})
	}

	return c.JSON(http.StatusOK, map[string]string{"token": token})
}

func handleMe(c echo.Context) error {
	claims := echoauth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
	}

	database := db.GetDB()
	var user db.User
	if err := database.First(&user, "id = ?", claims.UserID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "user not found"})
	}

	return c.JSON(http.StatusOK, user)
}

func handleLogout(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

func handleGenerateAPIKey(c echo.Context) error {
	claims := echoauth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
	}

	key, err := generateAPIKey()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to generate key"})
	}

	database := db.GetDB()
	if err := database.Model(&db.User{}).Where("id = ?", claims.UserID).Update("api_key", key).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "database error"})
	}

	return c.JSON(http.StatusOK, map[string]string{"api_key": key})
}

func handleRevokeAPIKey(c echo.Context) error {
	claims := echoauth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
	}

	database := db.GetDB()
	if err := database.Model(&db.User{}).Where("id = ?", claims.UserID).Update("api_key", nil).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "database error"})
	}

	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

func handleDevToken(c echo.Context) error {
	var body struct {
		UserID string `json:"user_id"`
		Email  string `json:"email"`
		Name   string `json:"name"`
	}
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}
	if body.UserID == "" || body.Email == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "user_id and email are required"})
	}

	token, err := echoauth.SignToken(body.UserID, body.Email, body.Name)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to sign token"})
	}
	return c.JSON(http.StatusOK, map[string]string{"token": token})
}

func generateAPIKey() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

type githubUser struct{ Email, Name string }

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
		return "", err
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
