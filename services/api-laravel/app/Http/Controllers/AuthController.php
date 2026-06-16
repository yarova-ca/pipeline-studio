<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use App\Models\User;
use Firebase\JWT\JWT;

class AuthController extends Controller
{
    // GET /auth/login → redirect to GitHub OAuth
    public function login(): JsonResponse
    {
        $clientId = config('services.github.client_id');
        $redirect  = config('services.github.redirect');

        $url = 'https://github.com/login/oauth/authorize'
            . '?client_id=' . $clientId
            . '&redirect_uri=' . urlencode($redirect)
            . '&scope=user:email';

        return response()->json(['redirect_url' => $url]);
    }

    // GET /auth/callback → exchange code, upsert User, return JWT JSON
    public function callback(Request $request): JsonResponse
    {
        $code = $request->query('code');
        if (empty($code)) {
            return response()->json(['error' => 'Missing code'], 422);
        }

        $tokenResponse = Http::post('https://github.com/login/oauth/access_token', [
            'client_id'     => config('services.github.client_id'),
            'client_secret' => config('services.github.client_secret'),
            'code'          => $code,
            'redirect_uri'  => config('services.github.redirect'),
        ])->json();

        $accessToken = $tokenResponse['access_token'] ?? null;
        if (empty($accessToken)) {
            return response()->json(['error' => 'OAuth exchange failed'], 400);
        }

        $ghUser = Http::withToken($accessToken)
            ->get('https://api.github.com/user')
            ->json();

        $email = $ghUser['email'] ?? null;
        if (empty($email)) {
            $emails = Http::withToken($accessToken)
                ->get('https://api.github.com/user/emails')
                ->json();
            foreach ($emails as $e) {
                if ($e['primary'] ?? false) {
                    $email = $e['email'];
                    break;
                }
            }
        }

        if (empty($email)) {
            return response()->json(['error' => 'Could not retrieve email from GitHub'], 400);
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name'     => $ghUser['name'] ?? $ghUser['login'],
                'provider' => 'github',
            ]
        );

        return response()->json(['token' => $this->makeJwt($user), 'user' => $user]);
    }

    // GET /auth/me → auth required → return user
    public function me(): JsonResponse
    {
        return response()->json(auth()->user());
    }

    // POST /auth/logout → 200
    public function logout(): JsonResponse
    {
        return response()->json(['message' => 'Logged out']);
    }

    // POST /auth/api-key → generate and save API key
    public function generateApiKey(): JsonResponse
    {
        $user = auth()->user();
        $key  = Str::random(64);
        $user->update(['api_key' => $key]);

        return response()->json(['api_key' => $key]);
    }

    // DELETE /auth/api-key → revoke API key
    public function revokeApiKey(): JsonResponse
    {
        auth()->user()->update(['api_key' => null]);

        return response()->json(['message' => 'API key revoked']);
    }

    // POST /dev/token → local env only
    public function devToken(Request $request): JsonResponse
    {
        if (! app()->environment('local')) {
            return response()->json(['error' => 'Not available'], 403);
        }

        $email = $request->input('email', 'dev@example.com');
        $user  = User::firstOrCreate(
            ['email' => $email],
            ['name' => 'Dev User', 'provider' => 'local']
        );

        return response()->json(['token' => $this->makeJwt($user), 'user' => $user]);
    }

    private function makeJwt(User $user): string
    {
        $secret = config('app.jwt_secret');
        $now    = time();

        $payload = [
            'iss' => config('app.url'),
            'sub' => $user->id,
            'email' => $user->email,
            'name'  => $user->name,
            'iat'   => $now,
            // Session length is set by the active industry profile (HIPAA → 15 min).
            'exp'   => $now + \App\Support\Compliance::active()->sessionTimeoutSeconds,
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }
}
