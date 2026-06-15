import Config

# Compile-time config only. Runtime values live in runtime.exs.
config :app, ecto_repos: [App.Repo]

config :app, AppWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [formats: [json: AppWeb.ErrorJSON], layout: false],
  pubsub_server: App.PubSub

config :phoenix, :json_library, Jason

# I-12: structured JSON logs to stdout, with request_id, via logger_json.
config :logger, :default_handler,
  formatter: {LoggerJSON.Formatters.Basic, metadata: :all}

# Hammer rate-limit backend: in-memory ETS, 4h key expiry.
config :hammer,
  backend: {Hammer.Backend.ETS, [expiry_ms: 60_000 * 60 * 4, cleanup_interval_ms: 60_000 * 10]}
