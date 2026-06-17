defmodule App.MixProject do
  use Mix.Project

  def project do
    [
      app: :app,
      version: "1.0.0",
      elixir: "~> 1.17",
      # Coverage is reported, not gated. `mix test --cover` prints the summary
      # table but a low percentage must not fail CI (default threshold is 90%).
      # The threshold lives under :summary for the built-in cover tool.
      test_coverage: [summary: [threshold: 0]],
      deps: deps()
    ]
  end

  def application, do: [mod: {App.Application, []}, extra_applications: [:logger, :inets, :ssl]]

  defp deps do
    [
      {:phoenix, "~> 1.7"},
      {:jason, "~> 1.4"},
      {:plug_cowboy, "~> 2.7"},
      {:phoenix_html, "~> 4.0"},
      {:jose, "~> 1.11"},
      {:ecto_sql, "~> 3.11"},
      {:postgrex, "~> 0.17"},
      {:ecto_sqlite3, "~> 0.16", only: :test},

      # JSON structured logging — emits one JSON object per log line to stdout
      {:logger_json, "~> 6.0"},

      # Rate limiting via Hammer (token bucket, in-memory per IP)
      {:hammer, "~> 6.2"},

      # OpenTelemetry — guarded by OTEL_ENABLED=true in application.ex
      {:opentelemetry, "~> 1.4"},
      {:opentelemetry_api, "~> 1.4"},
      {:opentelemetry_exporter, "~> 1.7"},
      {:opentelemetry_phoenix, "~> 2.0"},

      # OpenAPI spec via open_api_spex — spec served at /api/openapi.json
      {:open_api_spex, "~> 3.18"}
    ]
  end
end
