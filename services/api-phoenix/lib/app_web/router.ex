defmodule AppWeb.Router do
  use Phoenix.Router

  alias AppWeb.Plugs.RequireAuth

  pipeline :api do
    plug :accepts, ["json"]
    # Rate limiting — 100 requests per minute per IP via Hammer.
    # Health endpoints are exempt so k8s probes are never blocked.
    plug AppWeb.Plugs.RateLimit
  end

  pipeline :authenticated do
    plug :accepts, ["json"]
    plug RequireAuth
  end

  scope "/", AppWeb do
    pipe_through :api

    get "/", HealthController, :hello
    get "/health", HealthController, :health
    get "/health/live", HealthController, :liveness
    get "/health/ready", HealthController, :readiness
  end

  # Metrics — no rate limiting so Prometheus scrapes are never throttled.
  scope "/", AppWeb do
    get "/metrics", MetricsController, :index
  end

  scope "/auth", AppWeb do
    pipe_through :api

    get "/login", AuthController, :login
    get "/callback", AuthController, :callback
    get "/me", AuthController, :me
    post "/logout", AuthController, :logout
    post "/api-key", AuthController, :create_api_key
    delete "/api-key", AuthController, :delete_api_key
  end

  if Mix.env() == :dev do
    scope "/dev", AppWeb do
      pipe_through :api

      post "/token", AuthController, :dev_token
    end
  end

  scope "/", AppWeb do
    pipe_through :authenticated

    resources "/items", UserItemController, except: [:new, :edit]
  end

  # OpenAPI spec at /api/openapi.json — served by open_api_spex.
  pipeline :openapi do
    plug :accepts, ["json"]
    plug OpenApiSpex.Plug.PutApiSpec, module: AppWeb.ApiSpec
  end

  scope "/api" do
    pipe_through :openapi
    get "/openapi.json", OpenApiSpex.Plug.RenderSpec, []
  end
end
