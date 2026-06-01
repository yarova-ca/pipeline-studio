use tonic::transport::Server;
use tonic_health::server::HealthReporter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let grpc_port = std::env::var("GRPC_PORT").unwrap_or_else(|_| "50051".to_string());
    let addr = format!("0.0.0.0:{}", grpc_port).parse()?;

    let (mut reporter, health_svc) = tonic_health::server::health_reporter();
    reporter.set_serving::<()>().await;

    println!("gRPC server on :{}", grpc_port);
    Server::builder()
        .add_service(health_svc)
        .serve(addr)
        .await?;
    Ok(())
}
