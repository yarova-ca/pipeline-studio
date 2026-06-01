<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Firebase\JWT\JWT;

class AuthTest extends TestCase
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

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->getJson('/auth/me')->assertStatus(401);
    }

    public function test_valid_jwt_returns_200(): void
    {
        $user  = User::factory()->create();
        $token = $this->makeJwt($user);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/auth/me')
            ->assertStatus(200)
            ->assertJsonFragment(['email' => $user->email]);
    }

    public function test_valid_api_key_returns_200(): void
    {
        $user = User::factory()->create(['api_key' => 'test-api-key-12345']);

        $this->withHeader('X-API-Key', 'test-api-key-12345')
            ->getJson('/auth/me')
            ->assertStatus(200)
            ->assertJsonFragment(['email' => $user->email]);
    }

    public function test_dev_token_returns_token_in_local_env(): void
    {
        $this->postJson('/dev/token', ['email' => 'dev@example.com'])
            ->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_generate_api_key_returns_key(): void
    {
        $user  = User::factory()->create();
        $token = $this->makeJwt($user);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/auth/api-key')
            ->assertStatus(200)
            ->assertJsonStructure(['api_key']);
    }

    public function test_revoke_api_key_sets_null(): void
    {
        $user = User::factory()->create(['api_key' => 'some-key']);
        $token = $this->makeJwt($user);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson('/auth/api-key')
            ->assertStatus(200);

        $this->assertNull($user->fresh()->api_key);
    }
}
