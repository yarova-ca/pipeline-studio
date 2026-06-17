<?php

namespace Tests\Feature;

use App\Support\Compliance;
use Tests\TestCase;

class ComplianceTest extends TestCase
{
    public function test_all_profiles_share_the_same_control_keys(): void
    {
        $catalog = Compliance::loadCatalog();
        $profiles = $catalog['profiles'];

        $this->assertNotEmpty($profiles, 'profiles.json must define at least one profile');

        $reference = null;
        foreach ($profiles as $key => $entry) {
            $keys = array_keys($entry['controls']);
            sort($keys);

            if ($reference === null) {
                $reference = $keys;
                continue;
            }

            $this->assertSame(
                $reference,
                $keys,
                "profile '{$key}' has different control keys than the catalog reference"
            );
        }
    }

    public function test_itsg_33_locks_canadian_residency_and_fips_crypto(): void
    {
        $catalog = Compliance::loadCatalog();
        $controls = $catalog['profiles']['itsg-33']['controls'];

        $this->assertSame('canada', $controls['data_residency']);
        $this->assertTrue($controls['fips_crypto']);
    }

    public function test_loader_selects_profile_from_env(): void
    {
        putenv('COMPLIANCE_PROFILE=itsg-33');
        try {
            $c = new Compliance();
            $this->assertSame('itsg-33', $c->profile);
            $this->assertSame('canada', $c->controls['data_residency']);
            $this->assertTrue($c->controls['fips_crypto']);
        } finally {
            putenv('COMPLIANCE_PROFILE');
        }
    }
}
