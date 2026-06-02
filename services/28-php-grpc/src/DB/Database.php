<?php
// PDO database access for PHP gRPC service.
// PDO: PHP Data Objects — database abstraction layer, built into PHP.

namespace App\DB;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = getenv('DATABASE_URL') ?: 'pgsql:host=localhost;dbname=app';
            // Parse postgresql:// URL to PDO DSN format
            if (str_starts_with($dsn, 'postgresql://') || str_starts_with($dsn, 'postgres://')) {
                $parsed = parse_url($dsn);
                $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s',
                    $parsed['host'] ?? 'localhost',
                    $parsed['port'] ?? '5432',
                    ltrim($parsed['path'] ?? '/app', '/')
                );
                $user = $parsed['user'] ?? 'app';
                $pass = $parsed['pass'] ?? '';
            }
            self::$instance = new PDO($dsn, $user ?? null, $pass ?? null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        }
        return self::$instance;
    }
}
