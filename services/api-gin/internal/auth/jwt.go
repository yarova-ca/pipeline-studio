package auth

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/yarova-ca/16-gin/internal/compliance"
)

// Claims holds the fields embedded in every signed JWT.
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	jwt.RegisteredClaims
}

// jwtSecret returns the signing secret from JWT_SECRET env var.
// Returns an error when the env var is unset or empty.
func jwtSecret() ([]byte, error) {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		return nil, errors.New("JWT_SECRET env var is not set")
	}
	if len(s) < 32 {
		return nil, errors.New("JWT_SECRET must be at least 32 characters")
	}
	return []byte(s), nil
}

// SignToken signs a new JWT for the given user, valid for 8 hours.
func SignToken(userID, email, name string) (string, error) {
	secret, err := jwtSecret()
	if err != nil {
		return "", err
	}

	claims := &Claims{
		UserID: userID,
		Email:  email,
		Name:   name,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt: jwt.NewNumericDate(time.Now()),
			// Session length is set by the active industry profile (HIPAA → 15 min).
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(compliance.Active.SessionTimeoutSeconds) * time.Second)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(secret)
	if err != nil {
		return "", fmt.Errorf("signing token: %w", err)
	}
	return signed, nil
}

// VerifyToken parses and validates a JWT string.
// Returns the Claims on success, or an error if the token is invalid or expired.
func VerifyToken(tokenStr string) (*Claims, error) {
	secret, err := jwtSecret()
	if err != nil {
		return nil, err
	}

	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("parsing token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}
	return claims, nil
}
