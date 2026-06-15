defmodule AppWeb.Plugs.RateLimit do
  @moduledoc """
  Rate limiter plug — 100 requests per minute per remote IP using Hammer.

  Health and docs endpoints are exempt so k8s probes are never blocked.
  Rejected requests receive HTTP 429 with a JSON error body.
  """

  import Plug.Conn

  # 100 requests per 60 seconds per IP.
  @limit 100
  @scale_ms 60_000

  @exempt_prefixes ["/health", "/api/openapi"]

  def init(opts), do: opts

  def call(%Plug.Conn{request_path: path} = conn, _opts) do
    if Enum.any?(@exempt_prefixes, &String.starts_with?(path, &1)) do
      conn
    else
      ip = conn |> get_peer_data() |> Map.get(:address) |> :inet.ntoa() |> to_string()
      case Hammer.check_rate("rate_limit:#{ip}", @scale_ms, @limit) do
        {:allow, _count} ->
          conn
        {:deny, _limit} ->
          conn
          |> put_resp_content_type("application/json")
          |> send_resp(429, ~s({"error":"Too many requests — try again in 60 seconds"}))
          |> halt()
      end
    end
  end
end
