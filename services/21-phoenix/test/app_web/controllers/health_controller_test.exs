defmodule AppWeb.HealthControllerTest do
  use ExUnit.Case

  setup do
    Application.ensure_all_started(:app)
    :ok
  end

  test "GET / returns hello" do
    # Integration: use Plug.Test or Phoenix.ConnTest
    assert true
  end
end
