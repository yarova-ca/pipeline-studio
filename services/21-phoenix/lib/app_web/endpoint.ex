defmodule AppWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :app

  plug Plug.RequestId
  plug Plug.Logger
  plug AppWeb.Router
end
