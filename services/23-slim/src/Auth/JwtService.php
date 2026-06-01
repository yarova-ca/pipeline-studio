<?php

namespace App\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

/**
 * JwtService — HS256 sign and verify.
 *
 * Algorithm: HS256
 * Expiry: 8 hours
 * Secret source: JWT_SECRET environment variable
 */
class JwtService
{
    private const ALGORITHM = 'HS256';
    private const TTL_SECONDS = 8 * 3600; // 8 hours

    public static function encode(array $payload): string
    {
        $now = time();
        return JWT::encode(
            array_merge($payload, ['iat' => $now, 'exp' => $now + self::TTL_SECONDS]),
            self::secret(),
            self::ALGORITHM
        );
    }

    public static function decode(string $token): ?object
    {
        try {
            return JWT::decode($token, new Key(self::secret(), self::ALGORITHM));
        } catch (ExpiredException | SignatureInvalidException | \UnexpectedValueException) {
            return null;
        }
    }

    private static function secret(): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET');
        if (empty($secret)) {
            throw new \RuntimeException('JWT_SECRET environment variable is not set');
        }
        return $secret;
    }
}
