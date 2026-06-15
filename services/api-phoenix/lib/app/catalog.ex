defmodule App.Catalog do
  @moduledoc """
  Context for catalog item operations. All queries scoped to a user.
  """

  import Ecto.Query
  alias App.Repo
  alias App.Catalog.Item

  def list_items(user_id) do
    Item
    |> where([i], i.user_id == ^user_id)
    |> order_by([i], desc: i.inserted_at)
    |> Repo.all()
  end

  def get_item(id, user_id) do
    Item
    |> where([i], i.id == ^id and i.user_id == ^user_id)
    |> Repo.one()
  end

  def create_item(attrs, user_id) do
    %Item{}
    |> Item.changeset(Map.put(attrs, "user_id", user_id))
    |> Repo.insert()
  end

  def update_item(item, attrs) do
    item
    |> Item.changeset(attrs)
    |> Repo.update()
  end

  def delete_item(item) do
    Repo.delete(item)
  end
end
