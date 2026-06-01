<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_hello(): void
    {
        $r = $this->getJson('/');
        $r->assertStatus(200)->assertJsonFragment(['framework' => '23-laravel']);
    }

    public function test_health(): void
    {
        $r = $this->getJson('/health');
        $r->assertStatus(200)->assertJsonFragment(['status' => 'ok']);
    }

    public function test_liveness(): void
    {
        $this->getJson('/health/live')->assertStatus(200);
    }

    public function test_readiness(): void
    {
        $this->getJson('/health/ready')->assertStatus(200);
    }
}
