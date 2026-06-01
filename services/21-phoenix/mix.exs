defmodule App.MixProject do
  use Mix.Project

  def project do
    [
      app: :app,
      version: "1.0.0",
      elixir: "~> 1.17",
      deps: deps()
    ]
  end

  def application, do: [mod: {App.Application, []}, extra_applications: [:logger, :inets, :ssl]]

  defp deps do
    [
      {:phoenix, "~> 1.7"},
      {:jason, "~> 1.4"},
      {:plug_cowboy, "~> 2.7"},
      {:phoenix_html, "~> 4.0"},
      {:jose, "~> 1.11"},
      {:ecto_sql, "~> 3.11"},
      {:postgrex, "~> 0.17"},
      {:ecto_sqlite3, "~> 0.16", only: :test}
    ]
  end
end
