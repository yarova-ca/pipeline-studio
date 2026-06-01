require "grpc"
require "grpc/health/v1/health_services_pb"

class HealthService < Grpc::Health::V1::Health::Service
  def check(req, _call)
    Grpc::Health::V1::HealthCheckResponse.new(status: :SERVING)
  end
end

grpc_port = ENV.fetch("GRPC_PORT", "50051")
s = GRPC::RpcServer.new
s.add_http2_port("0.0.0.0:#{grpc_port}", :this_port_is_insecure)
s.handle(HealthService)
puts "gRPC server on :#{grpc_port}"
s.run_till_terminated_or_interrupted([1, "int", "SIGTERM"])
