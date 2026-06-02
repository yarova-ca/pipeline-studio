use http_body_util::Full;
use hyper::body::Bytes;
use hyper::service::service_fn;
use hyper::{Request, Response};
use prometheus::{Encoder, TextEncoder};
use tonic::transport::Server;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env()
            .add_directive(tracing::Level::INFO.into()))
        .init();

    let grpc_port = std::env::var("GRPC_PORT").unwrap_or_else(|_| "50051".to_string());
    let metrics_port = std::env::var("METRICS_PORT").unwrap_or_else(|_| "9090".to_string());
    let addr = format!("0.0.0.0:{}", grpc_port).parse()?;

    // Spawn /metrics HTTP server on a separate port
    let metrics_addr = format!("0.0.0.0:{}", metrics_port).parse::<std::net::SocketAddr>()?;
    tokio::spawn(async move {
        let listener = tokio::net::TcpListener::bind(metrics_addr).await.unwrap();
        loop {
            let (stream, _) = listener.accept().await.unwrap();
            let io = hyper_util::rt::TokioIo::new(stream);
            tokio::spawn(async move {
                let svc = service_fn(|_req: Request<hyper::body::Incoming>| async {
                    let encoder = TextEncoder::new();
                    let metric_families = prometheus::gather();
                    let mut buffer = Vec::new();
                    encoder.encode(&metric_families, &mut buffer).unwrap();
                    Ok::<Response<Full<Bytes>>, hyper::Error>(
                        Response::builder()
                            .header("Content-Type", "text/plain; version=0.0.4")
                            .body(Full::new(Bytes::from(buffer)))
                            .unwrap(),
                    )
                });
                let _ = hyper::server::conn::http1::Builder::new()
                    .serve_connection(io, svc)
                    .await;
            });
        }
    });

    let (mut reporter, health_svc) = tonic_health::server::health_reporter();
    reporter.set_serving::<()>().await;

    tracing::info!(port = grpc_port, "gRPC server starting");
    Server::builder()
        .add_service(health_svc)
        .serve(addr)
        .await?;
    Ok(())
}
