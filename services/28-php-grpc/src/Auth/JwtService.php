<?php

declare(strict_types=1);

namespace App\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * JwtService — issues and validates JWT tokens for gRPC PHP service auth.
 *
 * JWT secret: loaded from JWT_SECRET env var.
 * Expiry: 8 hours from issuance.
 * Algorithm: HS256.
 *
 * Requires: firebase/php-jwt (composer require firebase/php-jwt)
 */
class JwtService
{
    private const ALGORITHM = 'HS256';
    private const TTL_SECONDS = 8 * 60 * 60; // 8 hours

    public static function encode(string $userId, string $email, string $name): string
    {
        $now = time();
        $payload = [
            'sub'   => $userId,
            'email' => $email,
            'name'  => $name,
            'iat'   => $now,
            'exp'   => $now + self::TTL_SECONDS,
        ];

        return JWT::encode($payload, self::secret(), self::ALGORITHM);
    }

    /**
     * Decodes and verifies a JWT string.
     *
     * Returns the decoded payload array on success.
     * Returns null on invalid signature, expiry, or malformed token.
     *
     * @return array<string, mixed>|null
     */
    public static function decode(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key(self::secret(), self::ALGORITHM));
            return (array) $decoded;
        } catch (\Exception) {
            return null;
        }
    }

    private static function secret(): string
    {
        $secret = getenv('JWT_SECRET');
        if ($secret === false || $secret === '') {
            throw new \RuntimeException('JWT_SECRET environment variable is not set');
        }
        return $secret;
    }
}
