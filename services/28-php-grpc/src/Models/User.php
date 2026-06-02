<?php
namespace App\Models;
use App\DB\Database;

class User {
    public static function findByApiKey(string $apiKey): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM users WHERE api_key = ?');
        $stmt->execute([$apiKey]);
        return $stmt->fetch() ?: null;
    }

    public static function upsert(string $email, string $name, string $provider = 'local'): array {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            INSERT INTO users (id, email, name, provider, created_at, updated_at)
            VALUES (gen_random_uuid()::text, ?, ?, ?, NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, updated_at=NOW()
            RETURNING *
        ');
        $stmt->execute([$email, $name, $provider]);
        return $stmt->fetch();
    }
}
