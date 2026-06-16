defmodule App.ComplianceTest do
  use ExUnit.Case

  # Read profiles.json straight from disk so we test the same catalog the
  # loader reads at runtime (App.Compliance reads from File.cwd!()/compliance).
  defp profiles do
    path = Path.join([File.cwd!(), "compliance", "profiles.json"])
    path |> File.read!() |> Jason.decode!() |> Map.fetch!("profiles")
  end

  test "every profile has the same control keys (uniform catalog)" do
    profs = profiles()
    refute profs == %{}

    [first | rest] = Map.values(profs)
    baseline_keys = first |> Map.fetch!("controls") |> Map.keys() |> MapSet.new()

    Enum.each(rest, fn entry ->
      keys = entry |> Map.fetch!("controls") |> Map.keys() |> MapSet.new()
      assert keys == baseline_keys
    end)
  end

  test "itsg-33 sets data_residency=canada and fips_crypto=true" do
    controls = profiles() |> Map.fetch!("itsg-33") |> Map.fetch!("controls")
    assert controls["data_residency"] == "canada"
    assert controls["fips_crypto"] == true
  end

  test "loader with COMPLIANCE_PROFILE=itsg-33 returns profile itsg-33" do
    prev = System.get_env("COMPLIANCE_PROFILE")
    System.put_env("COMPLIANCE_PROFILE", "itsg-33")

    try do
      App.Compliance.setup()
      active = App.Compliance.active()

      assert active.profile == "itsg-33"
      assert active.controls["data_residency"] == "canada"
      assert active.controls["fips_crypto"] == true
    after
      if prev, do: System.put_env("COMPLIANCE_PROFILE", prev), else: System.delete_env("COMPLIANCE_PROFILE")
    end
  end
end
