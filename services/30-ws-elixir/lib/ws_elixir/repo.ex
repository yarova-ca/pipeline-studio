defmodule WsElixir.Repo do
  use Ecto.Repo,
    otp_app: :ws_elixir,
    adapter: Ecto.Adapters.Postgres
end
