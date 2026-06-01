<?php

namespace App\Auth;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

/**
 * AuthMiddleware — resolves the authenticated user from:
 * 1. Authorization: Bearer <JWT>
 * 2. X-API-Key header → PDO lookup
 *
 * When authenticated: sets 'auth_user' attribute on the request.
 * When unauthenticated: returns 401 JSON immediately.
 */
class AuthMiddleware implements MiddlewareInterface
{
    public function __construct(private readonly \PDO $pdo) {}

    public function process(
        ServerRequestInterface $request,
        RequestHandlerInterface $handler
    ): ResponseInterface {
        $user = $this->resolveUser($request);

        if ($user === null) {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'Unauthorized']));
            return $response
                ->withStatus(401)
                ->withHeader('Content-Type', 'application/json');
        }

        return $handler->handle($request->withAttribute('auth_user', $user));
    }

    private function resolveUser(ServerRequestInterface $request): ?array
    {
        $headers = $request->getHeaders();

        // Attempt 1: Bearer JWT.
        $authHeader = $request->getHeaderLine('Authorization');
        if (str_starts_with($authHeader, 'Bearer ')) {
            $token  = substr($authHeader, 7);
            $claims = JwtService::decode($token);
            if ($claims === null) return null;

            $stmt = $this->pdo->prepare('SELECT id, email, name FROM users WHERE id = ?');
            $stmt->execute([$claims->sub ?? null]);
            return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
        }

        // Attempt 2: X-API-Key header.
        $apiKey = $request->getHeaderLine('X-API-Key');
        if (!empty($apiKey)) {
            $stmt = $this->pdo->prepare('SELECT id, email, name FROM users WHERE api_key = ?');
            $stmt->execute([$apiKey]);
            return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
        }

        return null;
    }
}
