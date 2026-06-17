package main

import (
	"context"
	"log"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/yarova-ca/28-go-grpc/internal/auth"
	"github.com/yarova-ca/28-go-grpc/internal/db"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"
)

// Validator is implemented by request messages that enforce their own
// constraints. I-6: any non-exempt request that implements Validator is
// checked before reaching the handler; a violation maps to INVALID_ARGUMENT.
type Validator interface {
	Validate() error
}

type healthServer struct{ grpc_health_v1.UnimplementedHealthServer }

func (s *healthServer) Check(ctx context.Context, req *grpc_health_v1.HealthCheckRequest) (*grpc_health_v1.HealthCheckResponse, error) {
	return &grpc_health_v1.HealthCheckResponse{Status: grpc_health_v1.HealthCheckResponse_SERVING}, nil
}

// I-13: golden-signal metric — gRPC call duration keyed by method and status code.
var grpcDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
	Name:    "grpc_server_handling_seconds",
	Help:    "gRPC call duration in seconds",
	Buckets: prometheus.DefBuckets,
}, []string{"method", "code"})

// authExempt reports whether a method bypasses the auth interceptor.
// Health and reflection must stay reachable for k8s probes and tooling.
func authExempt(method string) bool {
	return strings.HasPrefix(method, "/grpc.health.") ||
		strings.HasPrefix(method, "/grpc.reflection.")
}

// chainedUnary applies metrics to every call and auth to all non-exempt calls.
func chainedUnary(
	ctx context.Context,
	req interface{},
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (interface{}, error) {
	start := time.Now()
	wrapped := handler
	if !authExempt(info.FullMethod) {
		// I-3: every non-exempt method is authenticated.
		// I-6: after auth, validate the request before the handler runs.
		wrapped = func(c context.Context, r interface{}) (interface{}, error) {
			return auth.UnaryAuthInterceptor(c, r, info, validatingHandler(handler))
		}
	}
	resp, err := wrapped(ctx, req)
	code := "OK"
	if err != nil {
		code = "ERROR"
	}
	grpcDuration.WithLabelValues(info.FullMethod, code).Observe(time.Since(start).Seconds())
	return resp, err
}

// validatingHandler runs request validation just before the real handler.
// I-6: a request implementing Validator whose Validate() fails is rejected
// with INVALID_ARGUMENT and never reaches the handler.
func validatingHandler(handler grpc.UnaryHandler) grpc.UnaryHandler {
	return func(c context.Context, r interface{}) (interface{}, error) {
		if v, ok := r.(Validator); ok {
			if err := v.Validate(); err != nil {
				return nil, status.Error(codes.InvalidArgument, err.Error())
			}
		}
		return handler(c, r)
	}
}

// I-17: security headers on every HTTP sidecar response.
func withSecurityHeaders(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		next(w, r)
	}
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// I-1: refuse to boot on missing or weak config.
	if len(os.Getenv("JWT_SECRET")) < 32 {
		log.Fatal("FATAL: JWT_SECRET must be set and at least 32 characters")
	}

	if err := db.InitDB(); err != nil {
		log.Fatalf("FATAL: database init failed: %v", err)
	}

	grpcPort := envOr("GRPC_PORT", "50051")
	httpPort := envOr("HTTP_PORT", "8080")

	lis, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		log.Fatalf("listen: %v", err)
	}

	s := grpc.NewServer(grpc.UnaryInterceptor(chainedUnary))
	grpc_health_v1.RegisterHealthServer(s, &healthServer{})
	reflection.Register(s)

	// HTTP sidecar — k8s probes and Prometheus scrape.
	mux := http.NewServeMux()
	// I-10: liveness is true whenever the process is up.
	mux.HandleFunc("/health/live", withSecurityHeaders(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, `{"status":"ok"}`)
	}))
	// I-10: readiness is true only when the database is reachable.
	mux.HandleFunc("/health/ready", withSecurityHeaders(func(w http.ResponseWriter, r *http.Request) {
		sqlDB, err := db.GetDB().DB()
		if err == nil {
			err = sqlDB.Ping()
		}
		if err != nil {
			slog.Error("readiness db check failed", "err", err)
			writeJSON(w, http.StatusServiceUnavailable, `{"status":"error","db":"disconnected"}`)
			return
		}
		writeJSON(w, http.StatusOK, `{"status":"ok","db":"connected"}`)
	}))
	mux.Handle("/metrics", withSecurityHeaders(promhttp.Handler().ServeHTTP))
	httpSrv := &http.Server{Addr: ":" + httpPort, Handler: mux}

	go func() {
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("http sidecar: %v", err)
		}
	}()

	go func() {
		slog.Info("gRPC server listening", "port", grpcPort)
		if err := s.Serve(lis); err != nil {
			log.Fatalf("serve: %v", err)
		}
	}()

	// I-11: drain cleanly on SIGTERM.
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)
	<-stop
	slog.Info("shutting down")
	s.GracefulStop()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = httpSrv.Shutdown(ctx)
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func writeJSON(w http.ResponseWriter, code int, body string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, _ = w.Write([]byte(body))
}
