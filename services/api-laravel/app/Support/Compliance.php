<?php

namespace App\Support;

// Industry compliance profile, read at startup.
// One repo serves every industry; COMPLIANCE_PROFILE flips the active profile.
// Profiles live in compliance/profiles.json — one generated catalog, 30 profiles,
// every profile carrying the same control keys (uniform on/off).
class Compliance
{
    public string $profile = 'baseline';
    public string $name = '';
    public string $jurisdiction = '';

    /** @var array<string, bool|int|float|string> */
    public array $controls = [];

    private static ?Compliance $instance = null;

    public static function active(): Compliance
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct()
    {
        $profile = strtolower(getenv('COMPLIANCE_PROFILE') ?: 'baseline');

        $catalog = self::loadCatalog();
        $profiles = $catalog['profiles'] ?? [];

        if (!isset($profiles[$profile]) || !is_array($profiles[$profile])) {
            // A named profile with no matching entry must fail loud.
            fwrite(STDERR, "FATAL: unknown COMPLIANCE_PROFILE: {$profile}\n");
            exit(1);
        }

        $entry = $profiles[$profile];
        $this->profile = $profile;
        $this->name = (string) ($entry['name'] ?? '');
        $this->jurisdiction = (string) ($entry['jurisdiction'] ?? '');
        $this->controls = is_array($entry['controls'] ?? null) ? $entry['controls'] : [];
    }

    /**
     * Read and decode compliance/profiles.json.
     * Looks under base_path() first, then the current working directory.
     *
     * @return array<string, mixed>
     */
    public static function loadCatalog(): array
    {
        $candidates = [];
        if (function_exists('base_path')) {
            $candidates[] = base_path('compliance/profiles.json');
        }
        $candidates[] = getcwd() . '/compliance/profiles.json';

        foreach ($candidates as $path) {
            $text = @file_get_contents($path);
            if ($text === false) {
                continue;
            }
            $data = json_decode($text, true);
            if (!is_array($data)) {
                fwrite(STDERR, "FATAL: compliance/profiles.json is not valid JSON: {$path}\n");
                exit(1);
            }
            return $data;
        }

        fwrite(STDERR, "FATAL: compliance/profiles.json not loadable\n");
        exit(1);
    }
}
