defmodule AppWeb.Router do
  use Phoenix.Router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", AppWeb do
    pipe_through :api

    get "/", HealthController, :hello
    get "/health", HealthController, :health
    get "/health/live", HealthController, :liveness
    get "/health/ready", HealthController, :readiness
  end
end
