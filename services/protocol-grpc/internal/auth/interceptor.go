package auth

// gRPC unary and stream interceptors for JWT and API key auth.
//
// gRPC metadata is the equivalent of HTTP headers.
// Clients send: metadata.Pairs("authorization", "Bearer <token>")
//               metadata.Pairs("x-api-key", "<key>")
//
// On valid JWT: calls the handler with the user stored in context.
// On valid API key: DB lookup, calls handler with user in context.
// On missing or invalid credential: returns status.Unauthenticated.

import (
	"context"
	"strings"

	"github.com/yarova-ca/28-go-grpc/internal/db"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type contextKey string

const UserContextKey contextKey = "auth_user"

// UnaryAuthInterceptor enforces auth on every unary gRPC call.
func UnaryAuthInterceptor(
	ctx context.Context,
	req interface{},
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (interface{}, error) {
	user, err := authenticate(ctx)
	if err != nil {
		return nil, err
	}
	return handler(context.WithValue(ctx, UserContextKey, user), req)
}

// StreamAuthInterceptor enforces auth on every streaming gRPC call.
func StreamAuthInterceptor(
	srv interface{},
	ss grpc.ServerStream,
	info *grpc.StreamServerInfo,
	handler grpc.StreamHandler,
) error {
	user, err := authenticate(ss.Context())
	if err != nil {
		return err
	}
	wrapped := &wrappedStream{ss, context.WithValue(ss.Context(), UserContextKey, user)}
	return handler(srv, wrapped)
}

// UserFromContext extracts the authenticated Claims from the context.
// Returns nil when UnaryAuthInterceptor has not run or no user is present.
func UserFromContext(ctx context.Context) *Claims {
	val := ctx.Value(UserContextKey)
	if val == nil {
		return nil
	}
	c, _ := val.(*Claims)
	return c
}

func authenticate(ctx context.Context) (*Claims, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "authentication required")
	}

	// --- Attempt 1: Bearer JWT ---
	authValues := md.Get("authorization")
	if len(authValues) > 0 {
		authHeader := authValues[0]
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
			claims, err := VerifyToken(parts[1])
			if err != nil {
				return nil, status.Error(codes.Unauthenticated, "invalid token")
			}
			return claims, nil
		}
	}

	// --- Attempt 2: X-API-Key ---
	apiKeyValues := md.Get("x-api-key")
	if len(apiKeyValues) > 0 {
		apiKey := apiKeyValues[0]
		database := db.GetDB()
		var user db.User
		result := database.Where("api_key = ?", apiKey).First(&user)
		if result.Error != nil {
			return nil, status.Error(codes.Unauthenticated, "invalid api key")
		}
		return &Claims{
			UserID: user.ID,
			Email:  user.Email,
			Name:   user.Name,
		}, nil
	}

	return nil, status.Error(codes.Unauthenticated, "authentication required")
}

// wrappedStream wraps a ServerStream to carry a custom context.
type wrappedStream struct {
	grpc.ServerStream
	ctx context.Context
}

func (w *wrappedStream) Context() context.Context {
	return w.ctx
}
