defmodule App.Accounts do
  @moduledoc """
  Context for user account operations.
  """

  import Ecto.Query
  alias App.Repo
  alias App.Accounts.User

  def get_user(id) do
    # id comes from an untrusted JWT "sub" claim. The users.id column is a
    # binary_id (UUID), so a malformed value would raise Ecto.Query.CastError.
    # Treat a non-castable id as "no such user" (nil) so the auth plug returns
    # 401 instead of crashing with a 500.
    Repo.get(User, id)
  rescue
    Ecto.Query.CastError -> nil
  end

  def get_user_by_email(email) do
    Repo.get_by(User, email: email)
  end

  def get_user_by_api_key(api_key) do
    Repo.get_by(User, api_key: api_key)
  end

  def upsert_user(attrs) do
    case get_user_by_email(attrs[:email] || attrs["email"]) do
      nil ->
        %User{}
        |> User.changeset(attrs)
        |> Repo.insert()

      existing ->
        existing
        |> User.changeset(attrs)
        |> Repo.update()
    end
  end

  def regenerate_api_key(user) do
    api_key = :crypto.strong_rand_bytes(32) |> Base.encode16(case: :lower)

    user
    |> User.changeset(%{api_key: api_key})
    |> Repo.update()
  end

  def clear_api_key(user) do
    user
    |> User.changeset(%{api_key: nil})
    |> Repo.update()
  end
end
