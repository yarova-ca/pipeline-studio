defmodule App.Application do
  use Application

  def start(_type, _args) do
    # I-13: create the metrics table before the endpoint serves traffic.
    AppWeb.Metrics.setup()

    # Load the active industry profile (fails loud on a bad profile).
    App.Compliance.setup()

    # OpenTelemetry — enabled only when OTEL_ENABLED=true.
    # The opentelemetry_phoenix integration hooks into Phoenix telemetry events
    # and exports spans to the configured OTLP endpoint.
    #
    # opentelemetry_phoenix 2.0 replaced the Erlang :opentelemetry_phoenix.setup/0
    # with the Elixir OpentelemetryPhoenix.setup/1, which requires an :adapter.
    # We run Cowboy (plug_cowboy), so the Cowboy HTTP spans come from
    # :opentelemetry_cowboy.setup/0 plus adapter: :cowboy2.
    if System.get_env("OTEL_ENABLED") == "true" do
      :opentelemetry_cowboy.setup()
      OpentelemetryPhoenix.setup(adapter: :cowboy2)
    end

    # JSON structured logging — LoggerJSON formats all Logger calls as JSON.
    # Replaces the default plain-text Erlang console handler.
    :logger.set_primary_config(:level, :info)

    children = [
      App.Repo,
      {Phoenix.PubSub, name: App.PubSub},
      AppWeb.Endpoint
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: App.Supervisor)
  end
end
