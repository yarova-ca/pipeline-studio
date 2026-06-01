defmodule WsElixir.Application do
  use Application

  def start(_type, _args) do
    port = String.to_integer(System.get_env("PORT") || "8080")
    children = [
      {Plug.Cowboy, scheme: :http, plug: WsElixir.Router, options: [
        port: port,
        dispatch: [
          {:_, [
            {"/ws", WsElixir.SocketHandler, []},
            {:_, Plug.Cowboy.Handler, {WsElixir.Router, []}}
          ]}
        ]
      ]}
    ]
    opts = [strategy: :one_for_one, name: WsElixir.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
