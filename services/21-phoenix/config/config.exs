import Config

config :app, AppWeb.Endpoint,
  url: [host: "localhost"],
  http: [port: String.to_integer(System.get_env("PORT") || "4000")],
  server: true,
  secret_key_base: System.get_env("SECRET_KEY_BASE") || "dev_only_insecure_32_char_secret_key_base"

config :phoenix, :json_library, Jason
