defmodule AppWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :app

  plug Plug.RequestId

  # I-13: measure every request's duration into the Prometheus histogram.
  plug AppWeb.Plugs.Metrics

  # I-17: security headers on every response.
  plug AppWeb.Plugs.SecurityHeaders

  # I-12: JSON structured logging is configured as the Logger handler formatter
  # (config.exs). Phoenix request logs and app logs both emit one JSON line.
  plug AppWeb.Router
end
