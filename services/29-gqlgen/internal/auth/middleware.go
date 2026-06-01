package auth

// GraphQL auth context middleware for gqlgen.
//
// gqlgen uses an HTTP handler underneath, so standard HTTP headers apply.
// This middleware extracts auth from headers and stores it in the request context.
// GraphQL resolvers read user from context via UserFromContext.
//
// Resolution order:
//   1. Authorization: Bearer <JWT> header — verified without a DB hit.
//   2. X-API-Key header — GORM DB lookup.
//
// On valid auth: stores *Claims in context, calls next handler.
// On missing auth: stores nil in context, calls next handler.
//   Protected resolvers must check and return GraphQL errors.

import (
	"context"
	"net/http"
	"strings"

	"github.com/yarova-ca/29-gqlgen/internal/db"
)

type contextKey string

const UserContextKey contextKey = "auth_user"

// Middleware returns an HTTP middleware that extracts auth into the request context.
func Middleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()

			// --- Attempt 1: Bearer JWT ---
			if authHeader := r.Header.Get("Authorization"); authHeader != "" {
				parts := strings.SplitN(authHeader, " ", 2)
				if len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
					claims, err := VerifyToken(parts[1])
					if err == nil {
						ctx = context.WithValue(ctx, UserContextKey, claims)
						next.ServeHTTP(w, r.WithContext(ctx))
						return
					}
				}
			}

			// --- Attempt 2: X-API-Key ---
			if apiKey := r.Header.Get("X-API-Key"); apiKey != "" {
				database := db.GetDBOrNil()
				if database != nil {
					var user db.User
					if result := database.Where("api_key = ?", apiKey).First(&user); result.Error == nil {
						claims := &Claims{
							UserID: user.ID,
							Email:  user.Email,
							Name:   user.Name,
						}
						ctx = context.WithValue(ctx, UserContextKey, claims)
						next.ServeHTTP(w, r.WithContext(ctx))
						return
					}
				}
			}

			// --- No valid credentials — context user is nil ---
			next.ServeHTTP(w, r)
		})
	}
}

// UserFromContext extracts the authenticated Claims from the request context.
// Returns nil when the user is unauthenticated.
func UserFromContext(ctx context.Context) *Claims {
	val := ctx.Value(UserContextKey)
	if val == nil {
		return nil
	}
	c, _ := val.(*Claims)
	return c
}
