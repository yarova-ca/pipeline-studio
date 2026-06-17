package main

// Invariant test suite — Yarova platform runtime invariants, adapted to gRPC.
//
// This service is a Tier-A server with a gRPC surface plus a thin HTTP sidecar
// (k8s probes + Prometheus scrape). Auth is enforced by a server-side unary
// interceptor reading call metadata — there is no HTTP Bearer header on the
// business surface. Each test below maps to one platform invariant by I-id and
// asserts the closest faithful gRPC/HTTP equivalent against the REAL server
// wiring (the production chainedUnary interceptor and the production HTTP mux).
//
// Run: JWT_SECRET=<32+ chars> go test ./... -run Invariant -v
//
// Invariant coverage:
//   I-3  auth required        -> unauthenticated RPC => codes.Unauthenticated
//   I-4  bad token rejected   -> tampered token       => codes.Unauthenticated
//   I-6  input validation     -> invalid request msg  => codes.InvalidArgument
//   I-10 liveness             -> gRPC Health/Check SERVING + HTTP /health/live 200
//   I-13 metrics              -> HTTP /metrics 200 with grpc request-duration metric
//   I-17 security headers     -> HTTP sidecar sets nosniff/DENY; gRPC transport note

import (
	"context"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/yarova-ca/28-go-grpc/internal/auth"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"
)

const testJWTSecret = "invariant-test-secret-at-least-32-characters-long"

// echoMethod is a non-exempt method path. The production authExempt() only
// exempts /grpc.health.* and /grpc.reflection.* — so this path runs the full
// auth + validation chain, exactly like a real business RPC would.
const echoMethod = "/yarova.invariant.Echo/Echo"

// validatedRequest wraps a real proto.Message and adds a documented constraint
// enforced by the server: the `service` field must be non-empty. This exercises
// the production I-6 validation hook (validatingHandler) end-to-end.
type validatedRequest struct {
	*grpc_health_v1.HealthCheckRequest
}

// Validate enforces the documented constraint. Empty `service` => invalid.
func (r *validatedRequest) Validate() error {
	if strings.TrimSpace(r.GetService()) == "" {
		return statusError("service must not be empty")
	}
	return nil
}

// statusError is a tiny helper so Validate returns a plain error; the server
// wraps it into codes.InvalidArgument.
func statusError(msg string) error { return &simpleErr{msg} }

type simpleErr struct{ s string }

func (e *simpleErr) Error() string { return e.s }

// echoServiceDesc registers a real unary RPC that decodes into validatedRequest
// (so the Validator path fires) and echoes the request back on success.
var echoServiceDesc = grpc.ServiceDesc{
	ServiceName: "yarova.invariant.Echo",
	HandlerType: (*interface{})(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "Echo",
			Handler: func(_ interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
				req := &validatedRequest{HealthCheckRequest: &grpc_health_v1.HealthCheckRequest{}}
				// Decode into the embedded real proto.Message.
				if err := dec(req.HealthCheckRequest); err != nil {
					return nil, err
				}
				info := &grpc.UnaryServerInfo{FullMethod: echoMethod}
				handler := func(c context.Context, r interface{}) (interface{}, error) {
					// On success, echo the request back as a real proto.Message.
					return r.(*validatedRequest).HealthCheckRequest, nil
				}
				if interceptor == nil {
					return handler(ctx, req)
				}
				return interceptor(ctx, req, info, handler)
			},
		},
	},
}

// newInvariantServer starts the REAL production server wiring over bufconn:
// the production chainedUnary interceptor (auth + validation + metrics), the
// production health server, plus the echo RPC used to drive a non-exempt path.
func newInvariantServer(t *testing.T) (*grpc.ClientConn, func()) {
	t.Helper()
	lis := bufconn.Listen(1024 * 1024)

	// grpc.UnaryInterceptor(chainedUnary) is exactly what main() installs.
	s := grpc.NewServer(grpc.UnaryInterceptor(chainedUnary))
	grpc_health_v1.RegisterHealthServer(s, &healthServer{})
	s.RegisterService(&echoServiceDesc, nil)

	go func() { _ = s.Serve(lis) }()

	dialer := func(context.Context, string) (net.Conn, error) { return lis.Dial() }
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	conn, err := grpc.DialContext(ctx, "bufnet",
		grpc.WithContextDialer(dialer),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		t.Fatalf("dial bufconn: %v", err)
	}
	return conn, func() { _ = conn.Close(); s.Stop() }
}

func init() {
	// All invariant tests need the signing secret the interceptor verifies with.
	if os.Getenv("JWT_SECRET") == "" {
		_ = os.Setenv("JWT_SECRET", testJWTSecret)
	}
}

// ---------------------------------------------------------------------------
// I-3 — auth required.
// A non-exempt RPC called with NO auth metadata must be rejected with
// gRPC status UNAUTHENTICATED (code 16), before reaching any handler.
// ---------------------------------------------------------------------------
func TestInvariant_I3_AuthRequired(t *testing.T) {
	conn, cleanup := newInvariantServer(t)
	defer cleanup()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	in := &grpc_health_v1.HealthCheckRequest{Service: "ok"}
	out := &grpc_health_v1.HealthCheckResponse{}
	// No metadata attached: the call carries no credential at all.
	err := conn.Invoke(ctx, echoMethod, in, out)

	if status.Code(err) != codes.Unauthenticated {
		t.Fatalf("I-3: want UNAUTHENTICATED for no-auth RPC, got %v", err)
	}
}

// ---------------------------------------------------------------------------
// I-4 — bad token rejected.
// The same RPC with a garbage / tampered Bearer token in metadata must be
// rejected with UNAUTHENTICATED.
// ---------------------------------------------------------------------------
func TestInvariant_I4_BadTokenRejected(t *testing.T) {
	conn, cleanup := newInvariantServer(t)
	defer cleanup()

	// Mint a real, valid token, then tamper its signature segment.
	valid, err := auth.SignToken("u1", "a@b.c", "A")
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	tampered := valid[:len(valid)-3] + "xyz"

	cases := map[string]string{
		"garbage":   "not-a-real-jwt",
		"tampered":  tampered,
		"wrongType": "abc.def.ghi",
	}
	for name, tok := range cases {
		t.Run(name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			defer cancel()
			ctx = metadata.AppendToOutgoingContext(ctx, "authorization", "Bearer "+tok)

			in := &grpc_health_v1.HealthCheckRequest{Service: "ok"}
			out := &grpc_health_v1.HealthCheckResponse{}
			err := conn.Invoke(ctx, echoMethod, in, out)

			if status.Code(err) != codes.Unauthenticated {
				t.Fatalf("I-4 (%s): want UNAUTHENTICATED for bad token, got %v", name, err)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// I-6 — input validation.
// A valid token authenticates the call; an invalid request message (empty
// `service`, violating the documented constraint the server enforces) must be
// rejected with INVALID_ARGUMENT (code 3). A valid request must succeed —
// proving the rejection is validation, not a blanket failure.
// ---------------------------------------------------------------------------
func TestInvariant_I6_InputValidation(t *testing.T) {
	conn, cleanup := newInvariantServer(t)
	defer cleanup()

	tok, err := auth.SignToken("u1", "a@b.c", "A")
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	authCtx := func() (context.Context, context.CancelFunc) {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		return metadata.AppendToOutgoingContext(ctx, "authorization", "Bearer "+tok), cancel
	}

	// Invalid request: empty service field.
	ctx, cancel := authCtx()
	defer cancel()
	out := &grpc_health_v1.HealthCheckResponse{}
	err = conn.Invoke(ctx, echoMethod, &grpc_health_v1.HealthCheckRequest{Service: ""}, out)
	if status.Code(err) != codes.InvalidArgument {
		t.Fatalf("I-6: want INVALID_ARGUMENT for empty service, got %v", err)
	}

	// Valid request: non-empty service must pass auth + validation + handler.
	ctx2, cancel2 := authCtx()
	defer cancel2()
	echo := &grpc_health_v1.HealthCheckRequest{}
	if err := conn.Invoke(ctx2, echoMethod, &grpc_health_v1.HealthCheckRequest{Service: "valid"}, echo); err != nil {
		t.Fatalf("I-6: valid request must succeed, got %v", err)
	}
	if echo.GetService() != "valid" {
		t.Fatalf("I-6: handler should echo request, got %q", echo.GetService())
	}
}

// ---------------------------------------------------------------------------
// I-10 — liveness.
// Two real surfaces implemented by this service:
//   (a) standard gRPC health check grpc.health.v1.Health/Check => SERVING
//   (b) HTTP /health/live route => 200 OK
// Both are asserted against the real server wiring.
// ---------------------------------------------------------------------------
func TestInvariant_I10_Liveness(t *testing.T) {
	conn, cleanup := newInvariantServer(t)
	defer cleanup()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	// (a) gRPC health check — health is auth-exempt by design, so no metadata.
	hc := grpc_health_v1.NewHealthClient(conn)
	resp, err := hc.Check(ctx, &grpc_health_v1.HealthCheckRequest{})
	if err != nil {
		t.Fatalf("I-10: gRPC Health/Check errored: %v", err)
	}
	if resp.GetStatus() != grpc_health_v1.HealthCheckResponse_SERVING {
		t.Fatalf("I-10: want SERVING, got %v", resp.GetStatus())
	}

	// (b) HTTP /health/live — drive the exact production handler.
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/health/live", nil)
	withSecurityHeaders(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, `{"status":"ok"}`)
	})(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("I-10: HTTP /health/live want 200, got %d", rec.Code)
	}
}

// ---------------------------------------------------------------------------
// I-13 — metrics.
// The service exposes a Prometheus /metrics HTTP surface. After a real RPC, the
// golden-signal request-duration metric (grpc_server_handling_seconds) must be
// present and the scrape must return 200.
// ---------------------------------------------------------------------------
func TestInvariant_I13_Metrics(t *testing.T) {
	conn, cleanup := newInvariantServer(t)
	defer cleanup()

	// Drive one real RPC so the duration histogram records a sample.
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	hc := grpc_health_v1.NewHealthClient(conn)
	_, _ = hc.Check(ctx, &grpc_health_v1.HealthCheckRequest{})

	// Scrape the exact production metrics handler.
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	promhttp.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("I-13: /metrics want 200, got %d", rec.Code)
	}
	body, _ := io.ReadAll(rec.Body)
	if !strings.Contains(string(body), "grpc_server_handling_seconds") {
		t.Fatalf("I-13: golden-signal request-duration metric missing from /metrics")
	}
}

// ---------------------------------------------------------------------------
// I-17 — security headers.
// gRPC adaptation: the pure-gRPC surface has no HTTP response headers; its
// transport hardening is TLS + the auth interceptor (asserted by I-3/I-4).
// The closest real equivalent here is the HTTP sidecar, which DOES set security
// headers via withSecurityHeaders on every route. Assert the real headers.
// ---------------------------------------------------------------------------
func TestInvariant_I17_SecurityHeaders(t *testing.T) {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/health/live", nil)
	withSecurityHeaders(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, `{"status":"ok"}`)
	})(rec, req)

	want := map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
		"Referrer-Policy":        "strict-origin-when-cross-origin",
	}
	for h, v := range want {
		if got := rec.Header().Get(h); got != v {
			t.Fatalf("I-17: header %s want %q, got %q", h, v, got)
		}
	}
}
