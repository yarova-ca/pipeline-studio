import Config

config :ws_elixir, WsElixir.Repo,
  url: System.get_env("DATABASE_URL") || "ecto://app:devpassword@localhost/ws_elixir_dev",
  pool_size: 10
