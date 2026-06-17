import Config

# App.Repo uses the Postgres adapter, so the test database must be Postgres too.
# Defaults match the postgres service container in .github/workflows/05-test.yml
# (user: app, password: app, database: app_test). Override via env in CI/local.
config :app, App.Repo,
  username: System.get_env("POSTGRES_USER", "app"),
  password: System.get_env("POSTGRES_PASSWORD", "app"),
  hostname: System.get_env("POSTGRES_HOST", "localhost"),
  port: String.to_integer(System.get_env("POSTGRES_PORT", "5432")),
  database: System.get_env("POSTGRES_DB", "app_test"),
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10

config :app, AppWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  # Fixed test-only secret so App.Auth.Token can sign/verify JWTs in tests.
  # Real secret is injected from SECRET_KEY_BASE at runtime (config/runtime.exs).
  secret_key_base: "test-only-secret-key-base-not-used-in-production-0123456789",
  server: false
