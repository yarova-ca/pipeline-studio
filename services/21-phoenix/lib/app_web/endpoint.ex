defmodule AppWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :app

  plug Plug.RequestId

  # JSON structured logging — emits one JSON object per request to stdout.
  # LoggerJSON replaces Phoenix's default plain-text request logger.
  plug LoggerJSON.Plug

  plug AppWeb.Router
end
