import grpc
from grpc_health.v1 import health_pb2, health_pb2_grpc

def test_health_check():
    with grpc.insecure_channel("localhost:50051") as ch:
        stub = health_pb2_grpc.HealthStub(ch)
        resp = stub.Check(health_pb2.HealthCheckRequest())
        assert resp.status == health_pb2.HealthCheckResponse.SERVING
