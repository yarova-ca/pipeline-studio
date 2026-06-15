package routes

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	ginauth "github.com/yarova-ca/16-gin/internal/auth"
	"github.com/yarova-ca/16-gin/internal/db"
)

// RegisterAuth mounts all /auth and /dev routes on the provided engine.
func RegisterAuth(r *gin.Engine) {
	auth := r.Group("/auth")
	{
		auth.GET("/login", handleLogin)
		auth.GET("/callback", handleCallback)
		auth.GET("/me", ginauth.RequireAuth, handleMe)
		auth.POST("/logout", handleLogout)
		auth.POST("/api-key", ginauth.RequireAuth, handleGenerateAPIKey)
		auth.DELETE("/api-key", ginauth.RequireAuth, handleRevokeAPIKey)
	}

	// Dev-only token endpoint — disabled in release mode.
	if os.Getenv("GIN_MODE") != "release" {
		r.POST("/dev/token", handleDevToken)
	}
}

// handleLogin redirects the browser to GitHub OAuth.
func handleLogin(c *gin.Context) {
	clientID := os.Getenv("AUTH_CLIENT_ID")
	callbackURL := os.Getenv("AUTH_CALLBACK_URL")
	if clientID == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "OAuth not configured"})
		return
	}
	redirectURL := fmt.Sprintf(
		"https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=user:email",
		clientID, callbackURL,
	)
	c.Redirect(http.StatusFound, redirectURL)
}

// handleCallback exchanges the GitHub OAuth code for a user record and returns a JWT.
func handleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing code parameter"})
		return
	}

	accessToken, err := exchangeGitHubCode(code)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to exchange code"})
		return
	}

	ghUser, err := fetchGitHubUser(accessToken)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch user profile"})
		return
	}

	database := db.GetDB()
	user := db.User{
		Email:    ghUser.Email,
		Name:     ghUser.Name,
		Provider: "github",
	}
	result := database.Where(db.User{Email: ghUser.Email}).FirstOrCreate(&user)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	token, err := ginauth.SignToken(user.ID, user.Email, user.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

// handleMe returns the currently authenticated user's profile.
func handleMe(c *gin.Context) {
	claims := ginauth.GetClaims(c)
	if claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	database := db.GetDB()
	var user db.User
	if err := database.First(&user, "id = ?", claims.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// handleLogout returns a success acknowledgement.
// JWT revocation is client-side — instruct the client to delete the stored token.
func handleLogout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// handleGenerateAPIKey creates and stores a random API key for the authenticated user.
func handleGenerateAPIKey(c *gin.Context) {
	claims := ginauth.GetClaims(c)
	if claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	key, err := generateAPIKey()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate key"})
		return
	}

	database := db.GetDB()
	if err := database.Model(&db.User{}).Where("id = ?", claims.UserID).Update("api_key", key).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"api_key": key})
}

// handleRevokeAPIKey clears the API key for the authenticated user.
func handleRevokeAPIKey(c *gin.Context) {
	claims := ginauth.GetClaims(c)
	if claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	database := db.GetDB()
	if err := database.Model(&db.User{}).Where("id = ?", claims.UserID).Update("api_key", nil).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// handleDevToken issues a JWT without requiring OAuth.
// Only registered when GIN_MODE != "release".
func handleDevToken(c *gin.Context) {
	var body struct {
		UserID string `json:"user_id"`
		Email  string `json:"email"`
		Name   string `json:"name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if body.UserID == "" || body.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id and email are required"})
		return
	}

	token, err := ginauth.SignToken(body.UserID, body.Email, body.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": token})
}

// generateAPIKey returns a cryptographically random 32-byte hex string.
func generateAPIKey() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// githubUser holds the fields we need from the GitHub user API response.
type githubUser struct {
	Email string
	Name  string
}

// exchangeGitHubCode exchanges an OAuth code for a GitHub access token.
func exchangeGitHubCode(code string) (string, error) {
	clientID := os.Getenv("AUTH_CLIENT_ID")
	clientSecret := os.Getenv("AUTH_CLIENT_SECRET")
	callbackURL := os.Getenv("AUTH_CALLBACK_URL")

	req, err := http.NewRequest(http.MethodPost,
		"https://github.com/login/oauth/access_token", nil)
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

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub token endpoint returned %d", resp.StatusCode)
	}

	var payload struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return "", fmt.Errorf("decoding token response: %w", err)
	}
	if payload.Error != "" {
		return "", fmt.Errorf("GitHub error: %s", payload.Error)
	}
	return payload.AccessToken, nil
}

// fetchGitHubUser calls the GitHub user API with the given access token.
func fetchGitHubUser(accessToken string) (*githubUser, error) {
	req, err := http.NewRequest(http.MethodGet, "https://api.github.com/user", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching GitHub user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub user API returned %d", resp.StatusCode)
	}

	var payload struct {
		Login string `json:"login"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decoding user response: %w", err)
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
