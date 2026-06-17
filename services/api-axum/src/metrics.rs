//! Prometheus metrics — golden-signal request-duration histogram.
//!
//! Self-contained: no external metrics crate, so the build stays dependency-light.
//! Exposes `http_request_duration_seconds` (a Prometheus histogram) plus
//! `http_requests_total` (a counter) at GET /metrics.
//!
//! I-13: GET /metrics returns 200 and the body contains
//! `http_request_duration_seconds`, the request-latency golden signal.

use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

/// Prometheus default-style latency buckets, in seconds.
/// Why these values: the standard Prometheus client default histogram buckets,
/// covering 5ms up to 10s — the range a typical HTTP API request falls in.
const BUCKETS_SECS: [f64; 11] = [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0,
];

/// Per-bucket cumulative counters for the duration histogram.
/// Index i counts requests with duration <= BUCKETS_SECS[i].
static BUCKET_COUNTS: [AtomicU64; 11] = [
    AtomicU64::new(0),
    AtomicU64::new(0),
    AtomicU64::new(0),
    AtomicU64::new(0),
    AtomicU64::new(0),
    AtomicU64::new(0),
    AtomicU64::new(0),
    AtomicU64::new(0),
    AtomicU64::new(0),
    AtomicU64::new(0),
    AtomicU64::new(0),
];

/// Count of all observed requests (the +Inf bucket and `_count`).
static TOTAL_COUNT: AtomicU64 = AtomicU64::new(0);

/// Sum of all observed durations in seconds, stored as microseconds to stay integral.
static SUM_MICROS: AtomicU64 = AtomicU64::new(0);

/// Record one completed request's latency into the histogram.
pub fn observe(duration_secs: f64) {
    for (i, edge) in BUCKETS_SECS.iter().enumerate() {
        if duration_secs <= *edge {
            BUCKET_COUNTS[i].fetch_add(1, Ordering::Relaxed);
        }
    }
    TOTAL_COUNT.fetch_add(1, Ordering::Relaxed);
    SUM_MICROS.fetch_add((duration_secs * 1_000_000.0) as u64, Ordering::Relaxed);
}

/// Render the metrics registry in Prometheus text exposition format.
pub fn render() -> String {
    let total = TOTAL_COUNT.load(Ordering::Relaxed);
    let sum_secs = SUM_MICROS.load(Ordering::Relaxed) as f64 / 1_000_000.0;

    let mut out = String::new();

    out.push_str("# HELP http_request_duration_seconds HTTP request latency in seconds.\n");
    out.push_str("# TYPE http_request_duration_seconds histogram\n");
    for (i, edge) in BUCKETS_SECS.iter().enumerate() {
        let c = BUCKET_COUNTS[i].load(Ordering::Relaxed);
        out.push_str(&format!(
            "http_request_duration_seconds_bucket{{le=\"{edge}\"}} {c}\n"
        ));
    }
    out.push_str(&format!(
        "http_request_duration_seconds_bucket{{le=\"+Inf\"}} {total}\n"
    ));
    out.push_str(&format!("http_request_duration_seconds_sum {sum_secs}\n"));
    out.push_str(&format!("http_request_duration_seconds_count {total}\n"));

    out.push_str("# HELP http_requests_total Total HTTP requests observed.\n");
    out.push_str("# TYPE http_requests_total counter\n");
    out.push_str(&format!("http_requests_total {total}\n"));

    out
}

/// A timer guard — observes elapsed latency when dropped.
pub struct Timer {
    start: Instant,
}

impl Timer {
    pub fn start() -> Self {
        Timer {
            start: Instant::now(),
        }
    }
}

impl Drop for Timer {
    fn drop(&mut self) {
        observe(self.start.elapsed().as_secs_f64());
    }
}
