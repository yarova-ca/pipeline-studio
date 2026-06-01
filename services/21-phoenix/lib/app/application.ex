defmodule App.Application do
  use Application

  def start(_type, _args) do
    port = System.get_env("PORT", "4000") |> String.to_integer()

    children = [
      App.Repo,
      {Phoenix.PubSub, name: App.PubSub},
      {AppWeb.Endpoint, url: [host: "localhost", port: port]}
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: App.Supervisor)
  end
end
