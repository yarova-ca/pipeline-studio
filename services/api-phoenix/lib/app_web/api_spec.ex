defmodule AppWeb.ApiSpec do
  @moduledoc "OpenAPI spec definition for 21-phoenix canonical service."

  alias OpenApiSpex.{Components, Info, OpenApi, Paths, Server}
  @behaviour OpenApiSpex.OpenApi

  @impl OpenApiSpex.OpenApi
  def spec do
    %OpenApi{
      info: %Info{
        title: "Phoenix Service API",
        version: "1.0.0",
        description: "21-phoenix canonical service"
      },
      servers: [%Server{url: "/"}],
      paths: Paths.from_router(AppWeb.Router)
    }
    |> OpenApiSpex.resolve_schema_modules()
  end
end
