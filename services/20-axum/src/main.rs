use axum_service::{app, db::init_pool};
use std::{env, net::SocketAddr};
use tokio::net::TcpListener;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Initialise JSON structured logging via tracing-subscriber.
/// Emits one JSON object per log line to stdout.
fn init_logging() {
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(fmt::layer().json())
        .init();
}

/// Initialise OpenTelemetry when OTEL_ENABLED=true.
/// Returns a shutdown guard. No-op when the env var is absent.
#[cfg(not(test))]
fn init_otel() -> Option<opentelemetry_sdk::trace::TracerProvider> {
    if env::var("OTEL_ENABLED").as_deref() != Ok("true") {
        return None;
    }
    use opentelemetry::trace::TracerProvider as _;
    use opentelemetry_otlp::WithExportConfig;
    use opentelemetry_sdk::{runtime, trace as sdktrace, Resource};
    use opentelemetry::KeyValue;

    let exporter = opentelemetry_otlp::new_exporter().tonic().build_span_exporter()
        .expect("failed to build OTLP exporter");
    let provider = sdktrace::TracerProvider::builder()
        .with_batch_exporter(exporter, runtime::Tokio)
        .with_resource(Resource::new(vec![KeyValue::new("service.name", "20-axum")]))
        .build();
    opentelemetry::global::set_tracer_provider(provider.clone());
    tracing::info!(endpoint = ?env::var("OTEL_EXPORTER_OTLP_ENDPOINT").ok(), "otel enabled");
    Some(provider)
}

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();

    init_logging();

    // OpenTelemetry — guarded by OTEL_ENABLED=true.
    // Hold the provider alive for the server lifetime; shutdown on drop.
    #[cfg(not(test))]
    let _otel_provider = init_otel();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = init_pool(&database_url)
        .await
        .expect("failed to connect to database");

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .unwrap_or(8080);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(addr).await.unwrap();
    tracing::info!(port, "Axum server started");
    axum::serve(listener, app(Some(pool))).await.unwrap();
}
