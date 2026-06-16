defmodule App.Auth.Token do
  @moduledoc """
  JWT token signing and verification using JOSE.

  Token TTL: 8 hours.
  Algorithm: HS256 signed with SECRET_KEY_BASE.
  """

  # Session length is set by the active industry profile (HIPAA → 15 min).
  defp ttl_seconds, do: App.Compliance.active().session_timeout_seconds

  defp secret do
    Application.get_env(:app, AppWeb.Endpoint)[:secret_key_base] ||
      raise "SECRET_KEY_BASE not configured"
  end

  @doc """
  Signs a JWT for the given user.

  Returns a signed token string.
  """
  def sign_token(user_id, email, name) do
    now = System.system_time(:second)

    claims = %{
      "sub" => user_id,
      "email" => email,
      "name" => name,
      "iat" => now,
      "exp" => now + ttl_seconds()
    }

    jwk = JOSE.JWK.from_oct(secret())
    {_, token} = JOSE.JWT.sign(jwk, %{"alg" => "HS256"}, claims) |> JOSE.JWS.compact()
    token
  end

  @doc """
  Verifies a JWT and returns {:ok, claims} or {:error, reason}.

  Checks expiry. Returns claims map on success.
  """
  def verify_token(token) do
    jwk = JOSE.JWK.from_oct(secret())

    try do
      {true, %JOSE.JWT{fields: claims}, _} = JOSE.JWT.verify_strict(jwk, ["HS256"], token)
      now = System.system_time(:second)

      if claims["exp"] && claims["exp"] < now do
        {:error, :expired}
      else
        {:ok, claims}
      end
    rescue
      _ -> {:error, :invalid}
    catch
      _, _ -> {:error, :invalid}
    end
  end
end
