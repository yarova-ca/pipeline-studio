<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HealthController;

Route::get('/', [HealthController::class, 'hello']);
Route::get('/health', [HealthController::class, 'health']);
Route::get('/health/live', [HealthController::class, 'liveness']);
Route::get('/health/ready', [HealthController::class, 'readiness']);
