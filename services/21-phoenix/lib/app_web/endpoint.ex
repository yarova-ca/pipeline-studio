defmodule AppWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :app

  plug Plug.RequestId

  # JSON structured logging — emits one JSON object per request to stdout.
  # logger_json 6.x logs via telemetry, not a plug.
  # Plug.Telemetry emits [:phoenix, :endpoint, :start|:stop] events.
  # LoggerJSON formats those events as JSON (configured in application.ex).
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug AppWeb.Router
end
