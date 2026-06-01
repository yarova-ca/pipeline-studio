<?php

declare(strict_types=1);

namespace App\Auth;

/**
 * GrpcAuthInterceptor — validates JWT or API key from gRPC metadata.
 *
 * PHP gRPC does not have a built-in interceptor interface like Java/Go.
 * Instead, call authenticate() at the start of every service method.
 *
 * gRPC metadata in PHP is received as an associative array via $context->getMetadata().
 * Keys are lowercase. Values are arrays.
 *
 * Clients send:
 *   $metadata = ['authorization' => ['Bearer <token>']]
 *   $metadata = ['x-api-key'     => ['<key>']]
 *
 * On valid JWT: returns decoded payload array with sub, email, name.
 * On valid API key: returns user array from DB (requires PDO connection).
 * On missing or invalid credential: throws \RuntimeException with UNAUTHENTICATED message.
 */
class GrpcAuthInterceptor
{
    private ?\PDO $db;

    public function __construct(?\PDO $db = null)
    {
        $this->db = $db;
    }

    /**
     * Authenticates the gRPC call from its metadata.
     *
     * @param array<string, array<string>> $metadata gRPC metadata from $context->getMetadata()
     * @return array<string, mixed> Authenticated user payload
     * @throws \RuntimeException when authentication fails
     */
    public function authenticate(array $metadata): array
    {
        // --- Attempt 1: Bearer JWT ---
        $authValues = $metadata['authorization'] ?? [];
        $authHeader = $authValues[0] ?? '';

        if (str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, strlen('Bearer '));
            $payload = JwtService::decode($token);
            if ($payload !== null) {
                return $payload;
            }
            throw new \RuntimeException('UNAUTHENTICATED: Invalid or expired JWT token');
        }

        // --- Attempt 2: X-API-Key ---
        $apiKeyValues = $metadata['x-api-key'] ?? [];
        $apiKey = $apiKeyValues[0] ?? '';

        if ($apiKey !== '' && $this->db !== null) {
            $stmt = $this->db->prepare(
                'SELECT id, email, name FROM users WHERE api_key = ? LIMIT 1'
            );
            $stmt->execute([$apiKey]);
            $user = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($user !== false) {
                return [
                    'sub'   => $user['id'],
                    'email' => $user['email'],
                    'name'  => $user['name'],
                ];
            }
            throw new \RuntimeException('UNAUTHENTICATED: Invalid API key');
        }

        throw new \RuntimeException(
            'UNAUTHENTICATED: Authentication required. Provide Bearer token or x-api-key metadata.'
        );
    }
}
