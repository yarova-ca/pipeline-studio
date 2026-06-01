defmodule App.Application do
  use Application

  def start(_type, _args) do
    port = System.get_env("PORT", "4000") |> String.to_integer()

    # OpenTelemetry — enabled only when OTEL_ENABLED=true.
    # The opentelemetry_phoenix integration hooks into Phoenix telemetry events
    # and exports spans to the configured OTLP endpoint.
    if System.get_env("OTEL_ENABLED") == "true" do
      :opentelemetry_phoenix.setup()
    end

    # JSON structured logging — LoggerJSON formats all Logger calls as JSON.
    # Replaces the default plain-text Erlang console handler.
    :logger.set_primary_config(:level, :info)

    children = [
      App.Repo,
      {Phoenix.PubSub, name: App.PubSub},
      {AppWeb.Endpoint, url: [host: "localhost", port: port]}
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: App.Supervisor)
  end
end
