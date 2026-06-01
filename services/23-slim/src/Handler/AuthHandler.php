<?php

namespace App\Handler;

use App\Auth\JwtService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Response;

/**
 * AuthHandler — handles all /auth/* routes.
 *
 * Routes registered in public/index.php:
 *   GET  /auth/login
 *   GET  /auth/callback
 *   GET  /auth/me          (requires auth middleware)
 *   POST /auth/logout      (requires auth middleware)
 *   POST /auth/api-key     (requires auth middleware)
 *   DELETE /auth/api-key   (requires auth middleware)
 *   POST /dev/token        (dev-only, no auth)
 */
class AuthHandler
{
    public function __construct(private readonly \PDO $pdo) {}

    /** GET /auth/login — redirect to GitHub OAuth. */
    public function login(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $clientId    = getenv('GITHUB_CLIENT_ID')    ?: '';
        $redirectUri = getenv('GITHUB_REDIRECT_URI') ?: '';

        $url = 'https://github.com/login/oauth/authorize'
            . '?client_id=' . urlencode($clientId)
            . '&redirect_uri=' . urlencode($redirectUri)
            . '&scope=user:email';

        return $response->withHeader('Location', $url)->withStatus(302);
    }

    /** GET /auth/callback — exchange code, upsert user, return JWT. */
    public function callback(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $params = $request->getQueryParams();
        $code   = $params['code'] ?? null;

        if (empty($code)) {
            return $this->json($response, ['error' => 'Missing code'], 400);
        }

        // Exchange code for access token.
        $tokenRes = $this->httpPost('https://github.com/login/oauth/access_token', [
            'client_id'     => getenv('GITHUB_CLIENT_ID')     ?: '',
            'client_secret' => getenv('GITHUB_CLIENT_SECRET') ?: '',
            'code'          => $code,
        ], ['Accept: application/json']);

        $tokenBody = json_decode($tokenRes, true) ?? [];
        $accessToken = $tokenBody['access_token'] ?? null;

        if (empty($accessToken)) {
            return $this->json($response, ['error' => 'GitHub token exchange failed'], 401);
        }

        // Fetch GitHub user.
        $profileRes = $this->httpGet('https://api.github.com/user', [
            "Authorization: Bearer $accessToken",
            'Accept: application/json',
            'User-Agent: slim-app',
        ]);
        $profile = json_decode($profileRes, true) ?? null;

        if ($profile === null) {
            return $this->json($response, ['error' => 'GitHub profile fetch failed'], 401);
        }

        $email = $profile['email'] ?? ($profile['login'] . '@github.noemail');
        $name  = $profile['name']  ?? $profile['login'];

        // Upsert user.
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $existing = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($existing) {
            $userId = $existing['id'];
            $this->pdo->prepare('UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?')
                ->execute([$name, $userId]);
        } else {
            $userId = \Ramsey\Uuid\Uuid::uuid4()->toString();
            $this->pdo->prepare(
                'INSERT INTO users (id, email, name, provider, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())'
            )->execute([$userId, $email, $name, 'github']);
        }

        $token = JwtService::encode(['sub' => $userId, 'email' => $email, 'name' => $name]);
        return $this->json($response, ['token' => $token]);
    }

    /** GET /auth/me — return current user (auth middleware already validated). */
    public function me(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user = $request->getAttribute('auth_user');
        return $this->json($response, [
            'id'    => $user['id'],
            'email' => $user['email'],
            'name'  => $user['name'],
        ]);
    }

    /** POST /auth/logout — stateless JWT; no server-side action. */
    public function logout(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->json($response, ['status' => 'ok']);
    }

    /** POST /auth/api-key — generate and save an API key. */
    public function generateApiKey(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user   = $request->getAttribute('auth_user');
        $apiKey = bin2hex(random_bytes(32));

        $this->pdo->prepare('UPDATE users SET api_key = ?, updated_at = NOW() WHERE id = ?')
            ->execute([$apiKey, $user['id']]);

        return $this->json($response, ['api_key' => $apiKey]);
    }

    /** DELETE /auth/api-key — revoke API key. */
    public function deleteApiKey(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user = $request->getAttribute('auth_user');
        $this->pdo->prepare('UPDATE users SET api_key = NULL, updated_at = NOW() WHERE id = ?')
            ->execute([$user['id']]);

        return $this->json($response, ['status' => 'ok']);
    }

    /** POST /dev/token — dev-only JWT without OAuth. */
    public function devToken(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $appEnv = getenv('APP_ENV') ?: 'development';
        if ($appEnv === 'production') {
            return $this->json($response, ['error' => 'Not available'], 403);
        }

        $body  = json_decode((string) $request->getBody(), true) ?? [];
        $email = $body['email'] ?? 'dev@example.com';
        $name  = $body['name']  ?? 'Dev User';

        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $existing = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($existing) {
            $userId = $existing['id'];
        } else {
            $userId = \Ramsey\Uuid\Uuid::uuid4()->toString();
            $this->pdo->prepare(
                'INSERT INTO users (id, email, name, provider, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())'
            )->execute([$userId, $email, $name, 'dev']);
        }

        $token = JwtService::encode(['sub' => $userId, 'email' => $email, 'name' => $name]);
        return $this->json($response, ['token' => $token]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function json(ResponseInterface $response, mixed $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));
        return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
    }

    private function httpPost(string $url, array $fields, array $headers = []): string
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($fields),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
        ]);
        $res = curl_exec($ch);
        curl_close($ch);
        return $res ?: '';
    }

    private function httpGet(string $url, array $headers = []): string
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
        ]);
        $res = curl_exec($ch);
        curl_close($ch);
        return $res ?: '';
    }
}
