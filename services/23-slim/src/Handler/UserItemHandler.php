<?php

namespace App\Handler;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * UserItemHandler — CRUD for /users/me/items/*.
 * Auth middleware sets 'auth_user' attribute before these handlers run.
 */
class UserItemHandler
{
    public function __construct(private readonly \PDO $pdo) {}

    /** GET /users/me/items */
    public function list(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user  = $request->getAttribute('auth_user');
        $stmt  = $this->pdo->prepare(
            'SELECT id, title, description, user_id, created_at, updated_at
             FROM items WHERE user_id = ? ORDER BY created_at DESC'
        );
        $stmt->execute([$user['id']]);
        return $this->json($response, ['items' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    /** POST /users/me/items */
    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user  = $request->getAttribute('auth_user');
        $body  = json_decode((string) $request->getBody(), true) ?? [];
        $title = trim($body['title'] ?? '');

        if ($title === '') {
            return $this->json($response, ['error' => 'title is required'], 400);
        }

        $id   = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $desc = $body['description'] ?? null;

        $this->pdo->prepare(
            'INSERT INTO items (id, title, description, user_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())'
        )->execute([$id, $title, $desc, $user['id']]);

        $stmt = $this->pdo->prepare('SELECT * FROM items WHERE id = ?');
        $stmt->execute([$id]);
        return $this->json($response, $stmt->fetch(\PDO::FETCH_ASSOC), 201);
    }

    /** GET /users/me/items/{id} */
    public function get(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $user = $request->getAttribute('auth_user');
        $item = $this->findItem($args['id'], $user['id']);
        if ($item === null) return $this->json($response, ['error' => 'Item not found'], 404);
        return $this->json($response, $item);
    }

    /** PUT /users/me/items/{id} */
    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $user = $request->getAttribute('auth_user');
        $item = $this->findItem($args['id'], $user['id']);
        if ($item === null) return $this->json($response, ['error' => 'Item not found'], 404);

        $body    = json_decode((string) $request->getBody(), true) ?? [];
        $updates = ['updated_at = NOW()'];
        $params  = [];

        if (!empty(trim($body['title'] ?? ''))) {
            $updates[] = 'title = ?';
            $params[]  = trim($body['title']);
        }
        if (array_key_exists('description', $body)) {
            $updates[] = 'description = ?';
            $params[]  = $body['description'];
        }

        $params[] = $args['id'];
        $this->pdo->prepare(
            'UPDATE items SET ' . implode(', ', $updates) . ' WHERE id = ?'
        )->execute($params);

        $stmt = $this->pdo->prepare('SELECT * FROM items WHERE id = ?');
        $stmt->execute([$args['id']]);
        return $this->json($response, $stmt->fetch(\PDO::FETCH_ASSOC));
    }

    /** DELETE /users/me/items/{id} */
    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $user = $request->getAttribute('auth_user');
        $item = $this->findItem($args['id'], $user['id']);
        if ($item === null) return $this->json($response, ['error' => 'Item not found'], 404);

        $this->pdo->prepare('DELETE FROM items WHERE id = ?')->execute([$args['id']]);
        return $response->withStatus(204);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function findItem(string $id, string $userId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM items WHERE id = ? AND user_id = ?'
        );
        $stmt->execute([$id, $userId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    private function json(ResponseInterface $response, mixed $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));
        return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
    }
}
