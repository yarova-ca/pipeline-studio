defmodule AppWeb.InvariantsTest do
  @moduledoc """
  Invariant suite — each test maps to a Yarova invariant by I-id.

  Mirrors the unit style already used in this repo
  (auth_controller_test.exs, user_item_controller_test.exs):
  build a conn with Plug.Test, call the plug/controller directly,
  assert on conn.status / conn.resp_body. JWTs are minted with
  App.Auth.Token.sign_token, exactly as the existing tests do.
  """
  use ExUnit.Case

  alias App.Auth.Token

  setup do
    # Boots the app so AppWeb.Metrics.setup/0 creates the :http_metrics ETS
    # table that MetricsController.index reads. Same idiom as
    # health_controller_test.exs.
    Application.ensure_all_started(:app)
    :ok
  end

  # I-3: GET a protected route with NO Authorization header → 401
  test "I-3: missing auth header on a protected route returns 401" do
    conn =
      Plug.Test.conn(:get, "/auth/me")
      |> Plug.Conn.put_req_header("accept", "application/json")

    conn = AppWeb.Plugs.RequireAuth.call(conn, [])
    assert conn.halted
    assert conn.status == 401
  end

  # I-4: GET a protected route with a garbage/tampered Bearer token → 401
  test "I-4: tampered bearer token on a protected route returns 401" do
    conn =
      Plug.Test.conn(:get, "/auth/me")
      |> Plug.Conn.put_req_header("authorization", "Bearer not.a.real.token")

    conn = AppWeb.Plugs.RequireAuth.call(conn, [])
    assert conn.halted
    assert conn.status == 401
  end

  # I-6: a VALID-token write with an unknown extra body field → 400.
  # The unknown-field guard returns before any DB/Repo call, so this is a
  # pure controller unit test (no seeded user required). A valid token is
  # still minted to document the authenticated-write context.
  test "I-6: unknown body field on create returns 400" do
    _token = Token.sign_token("test-user-id", "test@example.com", "Test User")

    conn =
      Plug.Test.conn(:post, "/items", %{
        "title" => "Valid Title",
        "surprise_field" => "nope"
      })
      |> Plug.Conn.put_req_header("content-type", "application/json")

    conn = AppWeb.UserItemController.create(conn, %{
      "title" => "Valid Title",
      "surprise_field" => "nope"
    })

    assert conn.status == 400
  end

  # I-10: GET /health/live → 200
  test "I-10: liveness returns 200" do
    conn =
      Plug.Test.conn(:get, "/health/live")
      |> Plug.Conn.put_req_header("accept", "application/json")

    conn = AppWeb.HealthController.liveness(conn, %{})
    assert conn.status == 200
  end

  # I-13: /metrics → 200 and body contains the request-duration golden signal.
  # AppWeb.Metrics exposes http_request_duration_seconds.
  test "I-13: metrics endpoint exposes the request-duration metric" do
    conn = Plug.Test.conn(:get, "/metrics")

    conn = AppWeb.MetricsController.index(conn, %{})
    assert conn.status == 200
    assert conn.resp_body =~ "http_request_duration_seconds"
  end

  # I-17: a response carries security header X-Content-Type-Options: nosniff.
  # SecurityHeaders is plugged at the endpoint; call it directly on a conn.
  test "I-17: security header X-Content-Type-Options is nosniff" do
    conn = Plug.Test.conn(:get, "/health/live")

    conn = AppWeb.Plugs.SecurityHeaders.call(conn, [])
    assert Plug.Conn.get_resp_header(conn, "x-content-type-options") == ["nosniff"]
  end
end
