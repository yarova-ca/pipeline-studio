<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Firebase\JWT\JWT;

// Invariant suite — each test maps to a Yarova invariant by I-id.
// Mirrors tests/Feature/AuthTest.php and UserItemTest.php exactly:
// RefreshDatabase, User::factory(), JWT::encode with config('app.jwt_secret').
class InvariantsTest extends TestCase
{
    use RefreshDatabase;

    private function makeJwt(User $user): string
    {
        $secret = config('app.jwt_secret', 'test-secret');
        $now    = time();

        return JWT::encode([
            'sub'   => $user->id,
            'email' => $user->email,
            'name'  => $user->name,
            'iat'   => $now,
            'exp'   => $now + 3600,
        ], $secret, 'HS256');
    }

    // I-3: GET a protected route with NO Authorization header → 401
    public function test_i3_missing_auth_header_returns_401(): void
    {
        $this->getJson('/auth/me')->assertStatus(401);
    }

    // I-4: GET a protected route with a garbage/tampered Bearer token → 401
    public function test_i4_tampered_bearer_token_returns_401(): void
    {
        $this->withHeader('Authorization', 'Bearer not.a.real.token')
            ->getJson('/auth/me')
            ->assertStatus(401);
    }

    // I-6: POST with a VALID token + an unknown extra body field → 400
    public function test_i6_unknown_body_field_returns_400(): void
    {
        $user  = User::factory()->create();
        $token = $this->makeJwt($user);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/users/me/items', [
                'title'          => 'Valid Title',
                'surprise_field' => 'nope',
            ])
            ->assertStatus(400);
    }

    // I-10: GET /health/live → 200
    public function test_i10_liveness_returns_200(): void
    {
        $this->getJson('/health/live')->assertStatus(200);
    }

    // I-13: GET /metrics → 200 and body contains the request-duration metric.
    // App\Support\Metrics exposes http_request_duration_seconds. The histogram
    // registers lazily on observe(), so a prior request populates it first.
    public function test_i13_metrics_endpoint_exposes_request_duration(): void
    {
        // Generate one measured request so the histogram is registered.
        $this->getJson('/health/live')->assertStatus(200);

        $response = $this->get('/metrics');
        $response->assertStatus(200);
        $this->assertStringContainsString(
            'http_request_duration_seconds',
            $response->getContent(),
        );
    }

    // I-17: a response carries security header X-Content-Type-Options: nosniff
    public function test_i17_security_header_present(): void
    {
        $this->getJson('/health/live')
            ->assertStatus(200)
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }
}
