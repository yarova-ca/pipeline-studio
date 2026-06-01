<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Item;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Firebase\JWT\JWT;

class UserItemTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $secret    = config('app.jwt_secret', 'test-secret');
        $now       = time();
        $this->token = JWT::encode([
            'sub'   => $this->user->id,
            'email' => $this->user->email,
            'name'  => $this->user->name,
            'iat'   => $now,
            'exp'   => $now + 3600,
        ], $secret, 'HS256');
    }

    private function auth(): static
    {
        return $this->withHeader('Authorization', 'Bearer ' . $this->token);
    }

    public function test_index_returns_empty_list(): void
    {
        $this->auth()->getJson('/users/me/items')
            ->assertStatus(200)
            ->assertJson([]);
    }

    public function test_store_creates_item(): void
    {
        $this->auth()->postJson('/users/me/items', [
            'title'       => 'Test Item',
            'description' => 'A description',
        ])
            ->assertStatus(201)
            ->assertJsonFragment(['title' => 'Test Item']);
    }

    public function test_store_requires_title(): void
    {
        $this->auth()->postJson('/users/me/items', [])
            ->assertStatus(422);
    }

    public function test_show_returns_item(): void
    {
        $item = Item::factory()->create(['user_id' => $this->user->id]);

        $this->auth()->getJson('/users/me/items/' . $item->id)
            ->assertStatus(200)
            ->assertJsonFragment(['title' => $item->title]);
    }

    public function test_show_returns_404_for_other_user_item(): void
    {
        $other = User::factory()->create();
        $item  = Item::factory()->create(['user_id' => $other->id]);

        $this->auth()->getJson('/users/me/items/' . $item->id)
            ->assertStatus(404);
    }

    public function test_update_modifies_item(): void
    {
        $item = Item::factory()->create(['user_id' => $this->user->id]);

        $this->auth()->putJson('/users/me/items/' . $item->id, [
            'title' => 'Updated Title',
        ])
            ->assertStatus(200)
            ->assertJsonFragment(['title' => 'Updated Title']);
    }

    public function test_destroy_deletes_item(): void
    {
        $item = Item::factory()->create(['user_id' => $this->user->id]);

        $this->auth()->deleteJson('/users/me/items/' . $item->id)
            ->assertStatus(204);

        $this->assertNull(Item::find($item->id));
    }
}
