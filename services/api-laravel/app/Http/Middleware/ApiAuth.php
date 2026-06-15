<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

class ApiAuth
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $this->resolveUser($request);

        if ($user === null) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        auth()->setUser($user);

        return $next($request);
    }

    private function resolveUser(Request $request): ?User
    {
        $bearer = $request->bearerToken();
        if ($bearer !== null) {
            return $this->verifyJwt($bearer);
        }

        $apiKey = $request->header('X-API-Key');
        if ($apiKey !== null) {
            return User::where('api_key', $apiKey)->first();
        }

        return null;
    }

    private function verifyJwt(string $token): ?User
    {
        $secret = config('app.jwt_secret');
        if (empty($secret)) {
            return null;
        }

        try {
            $payload = JWT::decode($token, new Key($secret, 'HS256'));
            return User::find($payload->sub ?? null);
        } catch (ExpiredException | SignatureInvalidException | \UnexpectedValueException) {
            return null;
        }
    }
}
