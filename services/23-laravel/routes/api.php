<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserItemController;
use App\Http\Middleware\ApiAuth;

// Health
Route::get('/', [HealthController::class, 'hello']);
Route::get('/health', [HealthController::class, 'health']);
Route::get('/health/live', [HealthController::class, 'liveness']);
Route::get('/health/ready', [HealthController::class, 'readiness']);

// Auth — public
Route::get('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/callback', [AuthController::class, 'callback']);
Route::post('/auth/logout', [AuthController::class, 'logout']);

// Dev token — local only
Route::post('/dev/token', [AuthController::class, 'devToken']);

// Auth — protected
Route::middleware(ApiAuth::class)->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/api-key', [AuthController::class, 'generateApiKey']);
    Route::delete('/auth/api-key', [AuthController::class, 'revokeApiKey']);
});

// User items — protected
Route::middleware(ApiAuth::class)->prefix('users/me/items')->group(function () {
    Route::get('/', [UserItemController::class, 'index']);
    Route::post('/', [UserItemController::class, 'store']);
    Route::get('/{id}', [UserItemController::class, 'show']);
    Route::put('/{id}', [UserItemController::class, 'update']);
    Route::delete('/{id}', [UserItemController::class, 'destroy']);
});
