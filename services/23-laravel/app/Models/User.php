<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory;

    protected $fillable = [
        'email',
        'name',
        'api_key',
        'provider',
    ];

    protected $hidden = [
        'api_key',
    ];

    public function items()
    {
        return $this->hasMany(Item::class);
    }
}
