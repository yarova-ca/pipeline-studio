defmodule WsElixir.Auth.WsAuth do
  @moduledoc """
  WebSocket auth — validates auth on the HTTP upgrade request.

  WebSocket browser clients cannot set custom headers.
  Two auth paths are supported:

    1. Authorization: Bearer <JWT> in the upgrade headers (server clients).
    2. ?token=<JWT> query parameter in the WebSocket URL (browser clients).

  On valid auth: returns {:ok, user_claims}.
  On missing or invalid auth: returns {:error, reason}.
  Caller closes the connection on error.

  Usage in socket_handler init/2:
    case WsAuth.authenticate(req) do
      {:ok, claims}   -> {:cowboy_websocket, req, %{user: claims}}
      {:error, _}     -> {:ok, req, :stop}
    end
  """

  alias WsElixir.Auth.Jwt

  @doc """
  Extracts and verifies auth from a Cowboy WebSocket upgrade request.

  Returns {:ok, claims} on success.
  Returns {:error, reason} on failure.
  """
  def authenticate(req) do
    with :error <- try_bearer_header(req),
         :error <- try_token_param(req) do
      {:error, "Authentication required. Provide Bearer token or ?token= parameter."}
    end
  end

  defp try_bearer_header(req) do
    case :cowboy_req.header("authorization", req) do
      <<"Bearer ", token::binary>> ->
        case Jwt.verify_token(token) do
          {:ok, claims} -> {:ok, claims}
          {:error, _}   -> :error
        end
      _ ->
        :error
    end
  end

  defp try_token_param(req) do
    qs = :cowboy_req.qs(req)
    params = URI.decode_query(qs)

    case Map.get(params, "token") do
      nil ->
        :error
      token ->
        case Jwt.verify_token(token) do
          {:ok, claims} -> {:ok, claims}
          {:error, _}   -> :error
        end
    end
  end
end
