defmodule AppWeb.UserItemController do
  use Phoenix.Controller, formats: [:json]

  import Plug.Conn
  alias App.Catalog
  alias AppWeb.Plugs.RequireAuth

  # I-6: the only client-supplied fields allowed on an item write.
  @allowed_item_fields ["title", "description"]

  # All actions require authentication.
  # RequireAuth is applied at the pipeline level in the router.

  # GET /items — list all items for current user
  def index(conn, _params) do
    items = Catalog.list_items(conn.assigns.current_user.id)
    json(conn, %{items: Enum.map(items, &item_json/1)})
  end

  # POST /items — create item for current user
  def create(conn, params) do
    case unknown_fields(params) do
      [] -> do_create(conn, params)
      unknown -> reject_unknown(conn, unknown)
    end
  end

  defp do_create(conn, params) do
    attrs = Map.take(params, ["title", "description"])

    case Catalog.create_item(attrs, conn.assigns.current_user.id) do
      {:ok, item} ->
        conn
        |> put_status(201)
        |> json(%{item: item_json(item)})

      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  # GET /items/:id — show one item (scoped to current user)
  def show(conn, %{"id" => id}) do
    case Catalog.get_item(id, conn.assigns.current_user.id) do
      nil ->
        conn
        |> put_status(404)
        |> json(%{error: "Item not found"})

      item ->
        json(conn, %{item: item_json(item)})
    end
  end

  # PUT/PATCH /items/:id — update item (scoped to current user)
  def update(conn, %{"id" => id} = params) do
    case Catalog.get_item(id, conn.assigns.current_user.id) do
      nil ->
        conn
        |> put_status(404)
        |> json(%{error: "Item not found"})

      item ->
        attrs = Map.take(params, ["title", "description"])

        case Catalog.update_item(item, attrs) do
          {:ok, updated} ->
            json(conn, %{item: item_json(updated)})

          {:error, changeset} ->
            conn
            |> put_status(422)
            |> json(%{errors: format_errors(changeset)})
        end
    end
  end

  # DELETE /items/:id — delete item (scoped to current user)
  def delete(conn, %{"id" => id}) do
    case Catalog.get_item(id, conn.assigns.current_user.id) do
      nil ->
        conn
        |> put_status(404)
        |> json(%{error: "Item not found"})

      item ->
        {:ok, _} = Catalog.delete_item(item)
        send_resp(conn, 204, "")
    end
  end

  # --- Private helpers ---

  # I-6: keys present in the body that are not allowed item fields.
  # Phoenix's Map.take silently drops unknowns, so an explicit strict check
  # is required for "unknown fields rejected" to genuinely hold (returns 400).
  # Ignores the routed path param "id" which is not client item data.
  defp unknown_fields(params) do
    params
    |> Map.keys()
    |> Enum.map(&to_string/1)
    |> Enum.reject(&(&1 in @allowed_item_fields or &1 == "id"))
  end

  defp reject_unknown(conn, unknown) do
    conn
    |> put_status(400)
    |> json(%{error: "Unknown field(s): #{Enum.join(unknown, ", ")}"})
  end

  defp item_json(item) do
    %{
      id: item.id,
      title: item.title,
      description: item.description,
      user_id: item.user_id,
      inserted_at: item.inserted_at,
      updated_at: item.updated_at
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
