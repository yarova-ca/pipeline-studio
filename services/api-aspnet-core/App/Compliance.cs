namespace App;

// Industry compliance profile, read at startup.
// One repo serves every industry; COMPLIANCE_PROFILE flips a few controls.
public class Compliance
{
    private static readonly HashSet<string> Valid =
        new() { "baseline", "hipaa", "pci", "fedramp", "fips", "pipeda" };

    public string Profile { get; } = "baseline";
    public bool AuditLogging { get; }
    public long SessionTimeoutSeconds { get; } = 8 * 60 * 60;
    public bool MfaRequired { get; }
    public bool EncryptionInTransit { get; }
    public Dictionary<string, string> Required { get; } = new();

    public Compliance()
    {
        var profile = (Environment.GetEnvironmentVariable("COMPLIANCE_PROFILE") ?? "baseline").ToLowerInvariant();
        if (!Valid.Contains(profile))
        {
            Console.Error.WriteLine($"FATAL: unknown COMPLIANCE_PROFILE: {profile}");
            Environment.Exit(1);
        }
        Profile = profile;
        if (profile == "baseline") return;

        string[] lines;
        try
        {
            lines = File.ReadAllLines(Path.Combine(Directory.GetCurrentDirectory(), "compliance", $"{profile}.yaml"));
        }
        catch (Exception e)
        {
            // A named profile with no readable file must fail loud.
            Console.Error.WriteLine($"FATAL: compliance profile not loadable: {profile}: {e.Message}");
            Environment.Exit(1);
            return;
        }

        var inBlock = false;
        foreach (var line in lines)
        {
            if (line.StartsWith("required_controls:")) { inBlock = true; continue; }
            if (!inBlock) continue;
            var t = line.TrimStart();
            if (t.StartsWith("- "))
            {
                var kv = t[2..].Split(':', 2);
                if (kv.Length != 2) continue;
                var key = kv[0].Trim();
                var val = kv[1].Split('#', 2)[0].Trim().Trim('"', '\'');
                Required[key] = val;
                switch (key)
                {
                    case "audit_logging": AuditLogging = val == "true"; break;
                    case "mfa_required": MfaRequired = val == "true"; break;
                    case "encryption_in_transit": EncryptionInTransit = val == "true"; break;
                    case "session_timeout":
                        if (long.TryParse(val, out var n)) SessionTimeoutSeconds = n;
                        break;
                }
            }
            else if (line.Length > 0 && !char.IsWhiteSpace(line[0])) break;
        }
    }
}
