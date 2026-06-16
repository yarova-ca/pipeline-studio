using System.Text.Json;

namespace App;

// Industry compliance profile, read at startup.
// One repo serves every industry; COMPLIANCE_PROFILE picks one profile
// out of compliance/profiles.json. The controls flip at boot, no rebuild.
public class Compliance
{
    public string Profile { get; }
    public string Name { get; }
    public string Jurisdiction { get; }

    // Raw control values for the active profile. Values are bool/number/string,
    // kept as JsonElement so /compliance serves them with their original JSON type.
    public IReadOnlyDictionary<string, JsonElement> Controls { get; }

    // JWT lifetime in seconds. Driven by the profile's session_timeout_seconds
    // control (HIPAA/ITSG-33 → 900s). A 0 or missing value means "no profile
    // limit", so fall back to the prior 8-hour default.
    public long SessionTimeoutSeconds
    {
        get
        {
            if (Controls.TryGetValue("session_timeout_seconds", out var v)
                && v.ValueKind == JsonValueKind.Number
                && v.TryGetInt64(out var seconds)
                && seconds > 0)
            {
                return seconds;
            }
            return 8 * 60 * 60;
        }
    }

    public Compliance()
    {
        var profile = (Environment.GetEnvironmentVariable("COMPLIANCE_PROFILE") ?? "baseline").Trim();

        var path = ResolveProfilesPath();
        if (path is null)
        {
            Console.Error.WriteLine("FATAL: compliance/profiles.json not found");
            Environment.Exit(1);
        }

        Catalog catalog;
        try
        {
            using var stream = File.OpenRead(path!);
            catalog = JsonSerializer.Deserialize<Catalog>(stream, JsonOptions)
                ?? throw new InvalidOperationException("profiles.json deserialized to null");
        }
        catch (Exception e)
        {
            Console.Error.WriteLine($"FATAL: compliance/profiles.json not loadable: {e.Message}");
            Environment.Exit(1);
            throw; // unreachable; keeps the compiler happy about non-null fields below.
        }

        if (!catalog.Profiles.TryGetValue(profile, out var active))
        {
            Console.Error.WriteLine($"FATAL: unknown COMPLIANCE_PROFILE: {profile}");
            Environment.Exit(1);
            throw new InvalidOperationException();
        }

        Profile = profile;
        Name = active.Name;
        Jurisdiction = active.Jurisdiction;
        Controls = active.Controls;
    }

    // Look for compliance/profiles.json next to the running app, then in the
    // working directory, then by walking up the tree (tests run from bin/).
    private static string? ResolveProfilesPath()
    {
        var roots = new[] { AppContext.BaseDirectory, Directory.GetCurrentDirectory() };
        foreach (var root in roots)
        {
            var dir = new DirectoryInfo(root);
            while (dir is not null)
            {
                var candidate = Path.Combine(dir.FullName, "compliance", "profiles.json");
                if (File.Exists(candidate)) return candidate;
                dir = dir.Parent;
            }
        }
        return null;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private sealed class Catalog
    {
        public Dictionary<string, ProfileEntry> Profiles { get; set; } = new();
    }

    private sealed class ProfileEntry
    {
        public string Name { get; set; } = "";
        public string Jurisdiction { get; set; } = "";
        public Dictionary<string, JsonElement> Controls { get; set; } = new();
    }
}
