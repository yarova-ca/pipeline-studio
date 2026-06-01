# OpenTelemetry — enabled only when OTEL_ENABLED=true.
# Set OTEL_ENABLED=true and OTEL_EXPORTER_OTLP_ENDPOINT to activate.
# Skipped silently when the env var is absent so the service starts
# without an OTel collector in local/dev mode.

if ENV.fetch("OTEL_ENABLED", "false") == "true"
  require "opentelemetry/sdk"
  require "opentelemetry/exporter/otlp"
  require "opentelemetry/instrumentation/rails"
  require "opentelemetry/instrumentation/active_record"

  OpenTelemetry::SDK.configure do |c|
    c.service_name = "22-rails"
    c.use "OpenTelemetry::Instrumentation::Rails"
    c.use "OpenTelemetry::Instrumentation::ActiveRecord"
  end

  Rails.logger.info("OTel enabled, endpoint: #{ENV.fetch('OTEL_EXPORTER_OTLP_ENDPOINT', 'default')}")
end
