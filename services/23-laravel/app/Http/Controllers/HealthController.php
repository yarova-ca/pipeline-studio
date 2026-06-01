<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function hello(): JsonResponse
    {
        return response()->json([
            'message' => 'Hello from Laravel 12',
            'framework' => '23-laravel',
            'version' => '1.0.0',
        ]);
    }

    public function health(): JsonResponse
    {
        return response()->json(['status' => 'ok', 'version' => '1.0.0']);
    }

    public function liveness(): JsonResponse
    {
        return response()->json(['status' => 'ok']);
    }

    public function readiness(): JsonResponse
    {
        return response()->json(['status' => 'ok']);
    }
}
