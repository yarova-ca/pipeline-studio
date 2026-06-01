defmodule AppWeb.HealthController do
  use Phoenix.Controller, formats: [:json]

  def hello(conn, _params),
    do: json(conn, %{message: "Hello from Phoenix 1.7", framework: "21-phoenix", version: "1.0.0"})

  def health(conn, _params), do: json(conn, %{status: "ok", version: "1.0.0"})
  def liveness(conn, _params), do: json(conn, %{status: "ok"})

  @doc """
  DB-checking readiness probe.
  Returns 503 when the database is unreachable so k8s removes the pod
  from the load balancer until the connection recovers.
  """
  def readiness(conn, _params) do
    try do
      Ecto.Adapters.SQL.query!(App.Repo, "SELECT 1", [])
      json(conn, %{status: "ok", db: "connected"})
    rescue
      e ->
        require Logger
        Logger.error("health/ready db check failed: #{inspect(e)}")
        conn
        |> put_status(503)
        |> json(%{status: "error", db: "disconnected"})
    end
  end
end
