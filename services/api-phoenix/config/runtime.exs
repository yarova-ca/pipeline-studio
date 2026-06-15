import Config

# runtime.exs runs at container start (for a release) and at boot (for mix).
# All environment-driven config lives here so one image serves every deploy.

# I-1: refuse to boot on missing or weak config.
secret = System.get_env("SECRET_KEY_BASE") || ""

if config_env() == :prod and String.length(secret) < 32 do
  IO.puts(:stderr, "FATAL: SECRET_KEY_BASE must be set and at least 32 characters")
  System.halt(1)
end

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise "FATAL: DATABASE_URL must be set"

  config :app, App.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

  port = String.to_integer(System.get_env("PORT") || "4000")

  config :app, AppWeb.Endpoint,
    http: [ip: {0, 0, 0, 0}, port: port],
    secret_key_base: secret,
    server: true
end
