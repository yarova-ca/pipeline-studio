<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

class ItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title'       => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'user_id'     => User::factory(),
        ];
    }
}
