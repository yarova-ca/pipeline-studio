<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * @OA\Info(
 *   title="Laravel Service API",
 *   version="1.0.0",
 *   description="23-laravel canonical service"
 * )
 */
class HealthController extends Controller
{
    /**
     * @OA\Get(
     *   path="/",
     *   summary="Hello endpoint",
     *   tags={"health"},
     *   @OA\Response(response=200, description="success")
     * )
     */
    public function hello(): JsonResponse
    {
        return response()->json([
            'message' => 'Hello from Laravel 12',
            'framework' => '23-laravel',
            'version' => '1.0.0',
        ]);
    }

    /**
     * @OA\Get(
     *   path="/health",
     *   summary="Liveness check",
     *   tags={"health"},
     *   @OA\Response(response=200, description="ok")
     * )
     */
    public function health(): JsonResponse
    {
        return response()->json(['status' => 'ok', 'version' => '1.0.0']);
    }

    /**
     * @OA\Get(
     *   path="/health/live",
     *   summary="Kubernetes liveness probe",
     *   tags={"health"},
     *   @OA\Response(response=200, description="ok")
     * )
     */
    public function liveness(): JsonResponse
    {
        return response()->json(['status' => 'ok']);
    }

    /**
     * The active industry profile and the controls in effect.
     * Switch with COMPLIANCE_PROFILE — the controls flip at boot, no rebuild.
     */
    public function compliance(): JsonResponse
    {
        $c = \App\Support\Compliance::active();
        return response()->json([
            'profile' => $c->profile,
            'name' => $c->name,
            'jurisdiction' => $c->jurisdiction,
            'controls' => $c->controls,
        ]);
    }

    /**
     * DB-checking readiness probe.
     * Returns 503 when the database is unreachable so k8s removes the pod
     * from the load balancer until the connection recovers.
     *
     * @OA\Get(
     *   path="/health/ready",
     *   summary="Kubernetes readiness probe — checks DB connectivity",
     *   tags={"health"},
     *   @OA\Response(response=200, description="db connected"),
     *   @OA\Response(response=503, description="db disconnected")
     * )
     */
    public function readiness(): JsonResponse
    {
        try {
            DB::select('SELECT 1');
            return response()->json(['status' => 'ok', 'db' => 'connected']);
        } catch (\Throwable $e) {
            Log::error('health/ready db check failed', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'db' => 'disconnected'], 503);
        }
    }
}
