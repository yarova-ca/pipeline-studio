defmodule AppWeb.ErrorJSON do
  # Renders error responses as JSON.
  # Phoenix calls render/2 with "<status>.json" on an unhandled error.
  def render(template, _assigns) do
    %{error: Phoenix.Controller.status_message_from_template(template)}
  end
end
