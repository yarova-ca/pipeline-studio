package routes

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v3"
	fiberauth "github.com/yarova-ca/16-fiber/internal/auth"
	"github.com/yarova-ca/16-fiber/internal/db"
)

// RegisterAuth mounts all /auth and /dev routes on the provided Fiber app.
func RegisterAuth(app *fiber.App) {
	app.Get("/auth/login", handleLogin)
	app.Get("/auth/callback", handleCallback)
	app.Get("/auth/me", fiberauth.RequireAuth, handleMe)
	app.Post("/auth/logout", handleLogout)
	app.Post("/auth/api-key", fiberauth.RequireAuth, handleGenerateAPIKey)
	app.Delete("/auth/api-key", fiberauth.RequireAuth, handleRevokeAPIKey)

	if os.Getenv("APP_ENV") != "production" {
		app.Post("/dev/token", handleDevToken)
	}
}

func handleLogin(c fiber.Ctx) error {
	clientID := os.Getenv("AUTH_CLIENT_ID")
	callbackURL := os.Getenv("AUTH_CALLBACK_URL")
	if clientID == "" {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "OAuth not configured"})
	}
	return c.Redirect().To(fmt.Sprintf(
		"https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=user:email",
		clientID, callbackURL,
	))
}

func handleCallback(c fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "missing code parameter"})
	}

	accessToken, err := exchangeGitHubCode(code)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "failed to exchange code"})
	}

	ghUser, err := fetchGitHubUser(accessToken)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "failed to fetch user profile"})
	}

	database := db.GetDB()
	user := db.User{Email: ghUser.Email, Name: ghUser.Name, Provider: "github"}
	result := database.Where(db.User{Email: ghUser.Email}).FirstOrCreate(&user)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
	}

	token, err := fiberauth.SignToken(user.ID, user.Email, user.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to sign token"})
	}

	return c.JSON(fiber.Map{"token": token})
}

func handleMe(c fiber.Ctx) error {
	claims := fiberauth.GetClaims(c)
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "not authenticated"})
	}

	database := db.GetDB()
	var user db.User
	if err := database.First(&user, "id = ?", claims.UserID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}

	return c.JSON(user)
}

func handleLogout(c fiber.Ctx) error {
	return c.JSON(fiber.Map{"ok": true})
}

func handleGenerateAPIKey(c fiber.Ctx) error {
	claims := fiberauth.GetClaims(c)
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "not authenticated"})
	}

	key, err := generateAPIKey()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to generate key"})
	}

	database := db.GetDB()
	if err := database.Model(&db.User{}).Where("id = ?", claims.UserID).Update("api_key", key).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
	}

	return c.JSON(fiber.Map{"api_key": key})
}

func handleRevokeAPIKey(c fiber.Ctx) error {
	claims := fiberauth.GetClaims(c)
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "not authenticated"})
	}

	database := db.GetDB()
	if err := database.Model(&db.User{}).Where("id = ?", claims.UserID).Update("api_key", nil).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
	}

	return c.JSON(fiber.Map{"ok": true})
}

func handleDevToken(c fiber.Ctx) error {
	var body struct {
		UserID string `json:"user_id"`
		Email  string `json:"email"`
		Name   string `json:"name"`
	}
	if err := c.Bind().JSON(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if body.UserID == "" || body.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "user_id and email are required"})
	}

	token, err := fiberauth.SignToken(body.UserID, body.Email, body.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to sign token"})
	}
	return c.JSON(fiber.Map{"token": token})
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
