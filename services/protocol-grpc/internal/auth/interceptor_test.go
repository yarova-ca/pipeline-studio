package auth

import (
	"context"
	"os"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// I-3: a non-exempt call with no credential is rejected with Unauthenticated.
func TestUnaryAuthRejectsMissingToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-at-least-32-characters-long-xx")
	info := &grpc.UnaryServerInfo{FullMethod: "/demo.Service/Method"}
	_, err := UnaryAuthInterceptor(context.Background(), nil, info,
		func(ctx context.Context, req interface{}) (interface{}, error) { return "ok", nil })
	if status.Code(err) != codes.Unauthenticated {
		t.Fatalf("want Unauthenticated, got %v", err)
	}
}

// I-3 / I-4: a valid Bearer token reaches the handler with the user in context.
func TestUnaryAuthAcceptsValidToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-at-least-32-characters-long-xx")
	tok, err := SignToken("u1", "a@b.c", "A")
	if err != nil {
		t.Fatal(err)
	}
	ctx := metadata.NewIncomingContext(context.Background(),
		metadata.Pairs("authorization", "Bearer "+tok))
	info := &grpc.UnaryServerInfo{FullMethod: "/demo.Service/Method"}
	var got *Claims
	resp, err := UnaryAuthInterceptor(ctx, nil, info,
		func(c context.Context, req interface{}) (interface{}, error) {
			got = UserFromContext(c)
			return "ok", nil
		})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp != "ok" || got == nil || got.UserID != "u1" {
		t.Fatalf("bad result: resp=%v user=%v", resp, got)
	}
}
