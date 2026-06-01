defmodule AppWeb.HealthController do
  use Phoenix.Controller, formats: [:json]

  def hello(conn, _params) do
    json(conn, %{message: "Hello from Phoenix 1.7", framework: "21-phoenix", version: "1.0.0"})
  end

  def health(conn, _params), do: json(conn, %{status: "ok", version: "1.0.0"})
  def liveness(conn, _params), do: json(conn, %{status: "ok"})
  def readiness(conn, _params), do: json(conn, %{status: "ok"})
end
