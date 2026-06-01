defmodule AppWeb.Router do
  use Phoenix.Router

  alias AppWeb.Plugs.RequireAuth

  pipeline :api do
    plug :accepts, ["json"]
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
end
