defmodule AppWeb.Plugs.RequireAuth do
  @moduledoc """
  Plug that authenticates requests via JWT Bearer token or X-API-Key header.

  On success: assigns :current_user to conn.
  On failure: returns 401 and halts.

  Check order:
  1. Authorization: Bearer <jwt>
  2. X-API-Key: <key>
  """

  import Plug.Conn
  alias App.Auth.Token
  alias App.Accounts

  def init(opts), do: opts

  def call(conn, _opts) do
    case authenticate(conn) do
      {:ok, user} ->
        assign(conn, :current_user, user)

      {:error, reason} ->
        conn
        |> put_resp_content_type("application/json")
        |> send_resp(401, Jason.encode!(%{error: "Unauthorized", reason: to_string(reason)}))
        |> halt()
    end
  end

  defp authenticate(conn) do
    case get_bearer_token(conn) do
      {:ok, token} -> verify_jwt(token)
      :error -> check_api_key(conn)
    end
  end

  defp get_bearer_token(conn) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token | _] -> {:ok, token}
      _ -> :error
    end
  end

  defp verify_jwt(token) do
    case Token.verify_token(token) do
      {:ok, claims} ->
        user_id = claims["sub"]

        case Accounts.get_user(user_id) do
          nil -> {:error, :user_not_found}
          user -> {:ok, user}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp check_api_key(conn) do
    case get_req_header(conn, "x-api-key") do
      [key | _] ->
        case Accounts.get_user_by_api_key(key) do
          nil -> {:error, :invalid_api_key}
          user -> {:ok, user}
        end

      [] ->
        {:error, :missing_credentials}
    end
  end
end
