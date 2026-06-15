defmodule AppWeb.AuthController do
  use Phoenix.Controller, formats: [:json]

  import Plug.Conn
  alias App.Accounts
  alias App.Auth.Token
  alias AppWeb.Plugs.RequireAuth

  @github_auth_url "https://github.com/login/oauth/authorize"
  @github_token_url "https://github.com/login/oauth/access_token"
  @github_user_url "https://api.github.com/user"

  # GET /auth/login — redirect to GitHub OAuth
  def login(conn, _params) do
    client_id = System.get_env("GITHUB_CLIENT_ID") || ""
    redirect_uri = System.get_env("GITHUB_CALLBACK_URL") || ""

    url =
      "#{@github_auth_url}?client_id=#{client_id}" <>
        "&redirect_uri=#{URI.encode_www_form(redirect_uri)}" <>
        "&scope=user:email"

    conn
    |> put_resp_header("location", url)
    |> send_resp(302, "")
  end

  # GET /auth/callback — exchange code, upsert user, return JWT
  def callback(conn, %{"code" => code}) do
    with {:ok, access_token} <- exchange_code(code),
         {:ok, gh_user} <- fetch_github_user(access_token),
         {:ok, user} <- upsert_from_github(gh_user) do
      token = Token.sign_token(user.id, user.email, user.name)
      json(conn, %{token: token, user: user_json(user)})
    else
      {:error, reason} ->
        conn
        |> put_status(400)
        |> json(%{error: "OAuth failed", reason: inspect(reason)})
    end
  end

  def callback(conn, _params) do
    conn
    |> put_status(400)
    |> json(%{error: "Missing OAuth code"})
  end

  # GET /auth/me — return current user (requires auth)
  def me(conn, _params) do
    conn = RequireAuth.call(conn, [])

    if conn.halted do
      conn
    else
      json(conn, %{user: user_json(conn.assigns.current_user)})
    end
  end

  # POST /auth/logout — stateless JWT; client discards token
  def logout(conn, _params) do
    json(conn, %{message: "Logged out"})
  end

  # POST /auth/api-key — regenerate API key (requires auth)
  def create_api_key(conn, _params) do
    conn = RequireAuth.call(conn, [])

    if conn.halted do
      conn
    else
      {:ok, user} = Accounts.regenerate_api_key(conn.assigns.current_user)
      json(conn, %{api_key: user.api_key})
    end
  end

  # DELETE /auth/api-key — revoke API key (requires auth)
  def delete_api_key(conn, _params) do
    conn = RequireAuth.call(conn, [])

    if conn.halted do
      conn
    else
      {:ok, _user} = Accounts.clear_api_key(conn.assigns.current_user)
      json(conn, %{message: "API key revoked"})
    end
  end

  # POST /dev/token — development-only token (guarded by Mix.env())
  def dev_token(conn, params) do
    if Mix.env() == :dev do
      user_id = params["user_id"] || "dev-user-id"
      email = params["email"] || "dev@example.com"
      name = params["name"] || "Dev User"
      token = Token.sign_token(user_id, email, name)
      json(conn, %{token: token})
    else
      conn
      |> put_status(404)
      |> json(%{error: "Not found"})
    end
  end

  # --- Private helpers ---

  defp exchange_code(code) do
    client_id = System.get_env("GITHUB_CLIENT_ID") || ""
    client_secret = System.get_env("GITHUB_CLIENT_SECRET") || ""

    body =
      URI.encode_query(%{
        client_id: client_id,
        client_secret: client_secret,
        code: code
      })

    case :httpc.request(
           :post,
           {String.to_charlist(@github_token_url), [{'accept', 'application/json'}],
            'application/x-www-form-urlencoded', body},
           [],
           []
         ) do
      {:ok, {{_, 200, _}, _headers, resp_body}} ->
        decoded = Jason.decode!(to_string(resp_body))
        {:ok, decoded["access_token"]}

      _ ->
        {:error, :github_token_exchange_failed}
    end
  end

  defp fetch_github_user(access_token) do
    case :httpc.request(
           :get,
           {String.to_charlist(@github_user_url),
            [
              {'authorization', String.to_charlist("Bearer #{access_token}")},
              {'user-agent', 'phoenix-app'}
            ]},
           [],
           []
         ) do
      {:ok, {{_, 200, _}, _headers, resp_body}} ->
        {:ok, Jason.decode!(to_string(resp_body))}

      _ ->
        {:error, :github_user_fetch_failed}
    end
  end

  defp upsert_from_github(gh_user) do
    Accounts.upsert_user(%{
      email: gh_user["email"] || "#{gh_user["login"]}@github.invalid",
      name: gh_user["name"] || gh_user["login"],
      provider: "github"
    })
  end

  defp user_json(user) do
    %{
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider
    }
  end
end
