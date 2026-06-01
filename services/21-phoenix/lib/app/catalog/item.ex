defmodule App.Catalog.Item do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "items" do
    field :title, :string
    field :description, :string

    belongs_to :user, App.Accounts.User

    timestamps()
  end

  @required_fields [:title, :user_id]
  @optional_fields [:description]

  def changeset(item, attrs) do
    item
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:title, min: 1, max: 255)
    |> foreign_key_constraint(:user_id)
  end
end
