defmodule App.Compliance do
  @moduledoc """
  Industry compliance profile, read at startup.
  One repo serves every industry; COMPLIANCE_PROFILE flips a few controls.
  """

  @valid ~w(baseline hipaa pci fedramp fips pipeda)
  @default %{
    profile: "baseline",
    audit_logging: false,
    session_timeout_seconds: 8 * 60 * 60,
    mfa_required: false,
    encryption_in_transit: false,
    required: %{}
  }

  @doc "Load and cache the active profile. Call once at application start."
  def setup do
    profile = String.downcase(System.get_env("COMPLIANCE_PROFILE") || "baseline")

    unless profile in @valid do
      IO.puts(:stderr, "FATAL: unknown COMPLIANCE_PROFILE: #{profile}")
      System.halt(1)
    end

    :persistent_term.put(__MODULE__, load(profile))
  end

  @doc "The controls this process booted with."
  def active, do: :persistent_term.get(__MODULE__, @default)

  defp load("baseline"), do: %{@default | profile: "baseline"}

  defp load(profile) do
    path = Path.join([File.cwd!(), "compliance", "#{profile}.yaml"])

    case File.read(path) do
      {:ok, text} ->
        parse(text, %{@default | profile: profile})

      {:error, reason} ->
        # A named profile with no readable file must fail loud.
        IO.puts(:stderr, "FATAL: compliance profile not loadable: #{profile}: #{inspect(reason)}")
        System.halt(1)
    end
  end

  defp parse(text, base) do
    {controls, _} =
      text
      |> String.split("\n")
      |> Enum.reduce_while({base, false}, fn line, {acc, in_block} ->
        cond do
          String.starts_with?(line, "required_controls:") ->
            {:cont, {acc, true}}

          not in_block ->
            {:cont, {acc, false}}

          true ->
            t = String.trim_leading(line)

            cond do
              String.starts_with?(t, "- ") ->
                {:cont, {apply_entry(acc, t), true}}

              line != "" and String.match?(line, ~r/^\S/) ->
                # Reached the next top-level key (e.g. pipeline_additions).
                {:halt, {acc, false}}

              true ->
                {:cont, {acc, true}}
            end
        end
      end)

    controls
  end

  defp apply_entry(acc, line) do
    case String.split(String.slice(line, 2..-1//1), ":", parts: 2) do
      [k, v] ->
        key = String.trim(k)

        val =
          v
          |> String.split("#", parts: 2)
          |> hd()
          |> String.trim()
          |> String.trim("\"")
          |> String.trim("'")

        acc = put_in(acc, [:required, key], val)

        case key do
          "audit_logging" -> %{acc | audit_logging: val == "true"}
          "mfa_required" -> %{acc | mfa_required: val == "true"}
          "encryption_in_transit" -> %{acc | encryption_in_transit: val == "true"}
          "session_timeout" -> set_timeout(acc, val)
          _ -> acc
        end

      _ ->
        acc
    end
  end

  defp set_timeout(acc, val) do
    case Integer.parse(val) do
      {n, _} -> %{acc | session_timeout_seconds: n}
      :error -> acc
    end
  end
end
