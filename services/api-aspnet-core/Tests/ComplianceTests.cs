using System.Text.Json;

// Verifies the compliance maturity rollout: profiles.json is the single source,
// every profile is uniform on the same control keys, ITSG-33 carries the
// Canadian Protected B controls, and the loader honours COMPLIANCE_PROFILE.
public class ComplianceTests
{
    // Locate compliance/profiles.json the same way the loader does, by walking
    // up from the test output directory until the file is found.
    private static string ProfilesPath()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "compliance", "profiles.json");
            if (File.Exists(candidate)) return candidate;
            dir = dir.Parent;
        }
        throw new FileNotFoundException("compliance/profiles.json not found from test output dir");
    }

    private static JsonElement Profiles()
    {
        using var doc = JsonDocument.Parse(File.ReadAllText(ProfilesPath()));
        // Clone so the value survives after the JsonDocument is disposed.
        return doc.RootElement.GetProperty("profiles").Clone();
    }

    [Fact]
    public void EveryProfile_HasTheSameControlKeys()
    {
        var profiles = Profiles();

        string[]? expected = null;
        string? expectedFrom = null;

        foreach (var profile in profiles.EnumerateObject())
        {
            var keys = profile.Value.GetProperty("controls")
                .EnumerateObject()
                .Select(p => p.Name)
                .OrderBy(k => k, StringComparer.Ordinal)
                .ToArray();

            if (expected is null)
            {
                expected = keys;
                expectedFrom = profile.Name;
                continue;
            }

            Assert.True(
                expected.SequenceEqual(keys),
                $"Profile '{profile.Name}' control keys differ from '{expectedFrom}'. " +
                $"Expected [{string.Join(", ", expected)}] but got [{string.Join(", ", keys)}].");
        }

        Assert.NotNull(expected);
    }

    [Fact]
    public void Itsg33_RequiresCanadianResidency_AndFipsCrypto()
    {
        var controls = Profiles().GetProperty("itsg-33").GetProperty("controls");

        Assert.Equal("canada", controls.GetProperty("data_residency").GetString());
        Assert.True(controls.GetProperty("fips_crypto").GetBoolean());
    }

    [Fact]
    public void Loader_HonoursComplianceProfileEnvVar()
    {
        var previous = Environment.GetEnvironmentVariable("COMPLIANCE_PROFILE");
        try
        {
            Environment.SetEnvironmentVariable("COMPLIANCE_PROFILE", "itsg-33");

            var compliance = new App.Compliance();

            Assert.Equal("itsg-33", compliance.Profile);
            Assert.Equal("canada", compliance.Controls["data_residency"].GetString());
            Assert.True(compliance.Controls["fips_crypto"].GetBoolean());
        }
        finally
        {
            Environment.SetEnvironmentVariable("COMPLIANCE_PROFILE", previous);
        }
    }
}
