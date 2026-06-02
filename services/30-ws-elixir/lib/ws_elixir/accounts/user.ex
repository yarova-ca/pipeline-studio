defmodule WsElixir.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  schema "users" do
    field :email, :string
    field :name, :string
    field :api_key, :string
    field :provider, :string, default: "local"
    timestamps()
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :name, :provider])
    |> validate_required([:email, :name])
    |> unique_constraint(:email)
  end
end
