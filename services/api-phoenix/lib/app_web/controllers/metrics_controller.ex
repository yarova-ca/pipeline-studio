defmodule AppWeb.MetricsController do
  use Phoenix.Controller, formats: [:json]

  # I-13: Prometheus scrape endpoint. Exempt from auth and rate limiting.
  def index(conn, _params) do
    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, AppWeb.Metrics.render())
  end
end
