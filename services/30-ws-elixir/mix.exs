defmodule WsElixir.MixProject do
  use Mix.Project
  def project do
    [app: :ws_elixir, version: "1.0.0", elixir: "~> 1.16",
     deps: deps()]
  end
  def application do
    [extra_applications: [:logger], mod: {WsElixir.Application, []}]
  end
  defp deps do
    [
      {:plug_cowboy, "~> 2.7"},
      {:jason, "~> 1.4"},
      {:ecto_sql, "~> 3.11"},
      {:postgrex, "~> 0.17"}
    ]
  end
end
