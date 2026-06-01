defmodule WsElixir.Auth.Jwt do
  @moduledoc """
  JWT creation and verification for WebSocket auth.

  Secret: loaded from JWT_SECRET env var.
  Expiry: 8 hours from issuance.
  Algorithm: HS256.

  Requires: joken (add {:joken, "~> 2.6"} to mix.exs deps)
  """

  @ttl_seconds 8 * 60 * 60

  @doc """
  Issues a signed JWT for the given user.

  Returns {:ok, token} on success.
  Returns {:error, reason} when JWT_SECRET is not set.
  """
  def sign_token(user_id, email, name) do
    with {:ok, secret} <- fetch_secret() do
      signer = Joken.Signer.create("HS256", secret)
      now = System.system_time(:second)

      claims = %{
        "sub"   => to_string(user_id),
        "email" => email,
        "name"  => name,
        "iat"   => now,
        "exp"   => now + @ttl_seconds
      }

      Joken.encode_and_sign(claims, signer)
    end
  end

  @doc """
  Verifies and decodes a JWT string.

  Returns {:ok, claims} when the token is valid and not expired.
  Returns {:error, reason} when the token is invalid, expired, or the secret is unset.
  """
  def verify_token(token) do
    with {:ok, secret} <- fetch_secret() do
      signer = Joken.Signer.create("HS256", secret)
      Joken.verify_and_validate(token, signer)
    end
  end

  defp fetch_secret do
    case System.get_env("JWT_SECRET") do
      nil -> {:error, "JWT_SECRET environment variable is not set"}
      ""  -> {:error, "JWT_SECRET environment variable is not set"}
      secret -> {:ok, secret}
    end
  end
end
