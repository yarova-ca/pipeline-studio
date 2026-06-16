<?php

namespace App\Support;

// Industry compliance profile, read at startup.
// One repo serves every industry; COMPLIANCE_PROFILE flips a few controls.
class Compliance
{
    public string $profile = 'baseline';
    public bool $auditLogging = false;
    public int $sessionTimeoutSeconds = 8 * 60 * 60;
    public bool $mfaRequired = false;
    public bool $encryptionInTransit = false;
    public array $required = [];

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
        $valid = ['baseline', 'hipaa', 'pci', 'fedramp', 'fips', 'pipeda'];
        if (!in_array($profile, $valid, true)) {
            fwrite(STDERR, "FATAL: unknown COMPLIANCE_PROFILE: {$profile}\n");
            exit(1);
        }
        $this->profile = $profile;
        if ($profile === 'baseline') {
            return;
        }

        $path = base_path('compliance/' . $profile . '.yaml');
        $text = @file_get_contents($path);
        if ($text === false) {
            // A named profile with no readable file must fail loud.
            fwrite(STDERR, "FATAL: compliance profile not loadable: {$profile}\n");
            exit(1);
        }

        $inBlock = false;
        foreach (explode("\n", $text) as $line) {
            if (str_starts_with($line, 'required_controls:')) {
                $inBlock = true;
                continue;
            }
            if (!$inBlock) {
                continue;
            }
            $t = ltrim($line);
            if (str_starts_with($t, '- ')) {
                $kv = explode(':', substr($t, 2), 2);
                if (count($kv) === 2) {
                    $key = trim($kv[0]);
                    $val = trim(explode('#', $kv[1], 2)[0]);
                    $val = trim($val, "\"'");
                    $this->required[$key] = $val;
                    if ($key === 'audit_logging') {
                        $this->auditLogging = $val === 'true';
                    } elseif ($key === 'mfa_required') {
                        $this->mfaRequired = $val === 'true';
                    } elseif ($key === 'encryption_in_transit') {
                        $this->encryptionInTransit = $val === 'true';
                    } elseif ($key === 'session_timeout' && is_numeric($val)) {
                        $this->sessionTimeoutSeconds = (int) $val;
                    }
                }
            } elseif ($line !== '' && !ctype_space($line[0])) {
                // Reached the next top-level key (e.g. pipeline_additions).
                break;
            }
        }
    }
}
