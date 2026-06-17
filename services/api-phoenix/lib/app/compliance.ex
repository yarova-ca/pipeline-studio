defmodule App.Compliance do
  @moduledoc """
  Industry compliance profile, read at startup from compliance/profiles.json.
  One repo serves every industry; COMPLIANCE_PROFILE selects the active profile.

  profiles.json shape:
    %{
      "device" => "backend",
      "catalogVersion" => 1,
      "controlMeta" => %{...},
      "profiles" => %{
        "<profile>" => %{
          "name" => "...",
          "priority" => "...",
          "jurisdiction" => "...",
          "controls" => %{"<control>" => true | false | number | string}
        }
      }
    }

  Every profile carries the same control keys (uniform on/off catalog).
  """

  @default %{
    profile: "baseline",
    name: "Baseline (no industry lens)",
    jurisdiction: "Safe general defaults",
    controls: %{}
  }

  @doc "Load and cache the active profile. Call once at application start."
  def setup do
    profile = String.downcase(System.get_env("COMPLIANCE_PROFILE") || "baseline")
    :persistent_term.put(__MODULE__, load(profile))
  end

  @doc "The profile this process booted with."
  def active, do: :persistent_term.get(__MODULE__, @default)

  @doc """
  Read profiles.json and return the requested profile as a map of
  %{profile, name, jurisdiction, controls}. Fails loud on any error.
  """
  def load(profile) do
    path = Path.join([File.cwd!(), "compliance", "profiles.json"])

    with {:ok, text} <- File.read(path),
         {:ok, json} <- Jason.decode(text),
         %{} = profiles <- Map.get(json, "profiles"),
         %{} = entry <- Map.get(profiles, profile) do
      %{
        profile: profile,
        name: Map.get(entry, "name", profile),
        jurisdiction: Map.get(entry, "jurisdiction", ""),
        controls: Map.get(entry, "controls", %{})
      }
    else
      {:error, reason} ->
        # A profile catalog that cannot be read or parsed must fail loud.
        IO.puts(:stderr, "FATAL: compliance profiles.json not loadable: #{inspect(reason)}")
        System.halt(1)

      nil ->
        # A named profile with no matching entry must fail loud.
        IO.puts(:stderr, "FATAL: unknown COMPLIANCE_PROFILE: #{profile}")
        System.halt(1)
    end
  end
end
