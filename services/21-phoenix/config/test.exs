import Config

config :app, App.Repo,
  adapter: Ecto.Adapters.SQLite3,
  database: ":memory:",
  pool: Ecto.Adapters.SQL.Sandbox

config :app, AppWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  server: false
