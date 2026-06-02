package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"
)

type healthServer struct{ grpc_health_v1.UnimplementedHealthServer }

func (s *healthServer) Check(ctx context.Context, req *grpc_health_v1.HealthCheckRequest) (*grpc_health_v1.HealthCheckResponse, error) {
	return &grpc_health_v1.HealthCheckResponse{Status: grpc_health_v1.HealthCheckResponse_SERVING}, nil
}

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" { grpcPort = "50051" }
	httpPort := os.Getenv("HTTP_PORT")
	if httpPort == "" { httpPort = "8080" }

	lis, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil { log.Fatalf("listen: %v", err) }

	s := grpc.NewServer()
	grpc_health_v1.RegisterHealthServer(s, &healthServer{})
	reflection.Register(s)

	// HTTP sidecar for Kubernetes /health probes
	go func() {
		http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"status":"ok"}`))
		})
		http.HandleFunc("/health/live", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"status":"ok"}`))
		})
		http.HandleFunc("/health/ready", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"status":"ok"}`))
		})
		if err := http.ListenAndServe(":"+httpPort, nil); err != nil {
			log.Fatalf("http sidecar: %v", err)
		}
	}()

	log.Printf("gRPC server listening on :%s", grpcPort)
	log.Printf("HTTP health sidecar on :%s", httpPort)
	if err := s.Serve(lis); err != nil { log.Fatalf("serve: %v", err) }
}
