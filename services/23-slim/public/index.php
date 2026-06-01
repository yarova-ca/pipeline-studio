<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Auth\AuthMiddleware;
use App\Handler\AuthHandler;
use App\Handler\UserItemHandler;
use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ── Environment ────────────────────────────────────────────────────────────
Dotenv\Dotenv::createImmutable(dirname(__DIR__))->safeLoad();

// ── Database ───────────────────────────────────────────────────────────────
$dsn = $_ENV['DATABASE_URL'] ?? getenv('DATABASE_URL') ?? null;
$pdo = $dsn
    ? new \PDO($dsn, null, null, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION])
    : null;

// ── App ────────────────────────────────────────────────────────────────────
$app = AppFactory::create();

// ── Health routes ──────────────────────────────────────────────────────────
$app->get('/', function (Request $req, Response $res) {
    $res->getBody()->write(json_encode([
        'message' => 'Hello from Slim 4.14',
        'framework' => '23-slim',
        'version' => '1.0.0',
    ]));
    return $res->withHeader('Content-Type', 'application/json');
});

$app->get('/health', function (Request $req, Response $res) {
    $res->getBody()->write(json_encode(['status' => 'ok', 'version' => '1.0.0']));
    return $res->withHeader('Content-Type', 'application/json');
});

$app->get('/health/live', function (Request $req, Response $res) {
    $res->getBody()->write(json_encode(['status' => 'ok']));
    return $res->withHeader('Content-Type', 'application/json');
});

$app->get('/health/ready', function (Request $req, Response $res) use ($pdo) {
    try {
        if ($pdo) $pdo->query('SELECT 1');
        $res->getBody()->write(json_encode(['status' => 'ok', 'db' => 'connected']));
        return $res->withHeader('Content-Type', 'application/json');
    } catch (\Exception $e) {
        $res->getBody()->write(json_encode(['status' => 'error', 'db' => 'disconnected']));
        return $res->withStatus(503)->withHeader('Content-Type', 'application/json');
    }
});

// ── Auth routes ────────────────────────────────────────────────────────────
if ($pdo) {
    $authHandler = new AuthHandler($pdo);
    $authMw      = new AuthMiddleware($pdo);
    $itemHandler = new UserItemHandler($pdo);

    $app->get('/auth/login',    [$authHandler, 'login']);
    $app->get('/auth/callback', [$authHandler, 'callback']);
    $app->post('/dev/token',    [$authHandler, 'devToken']);

    // Auth-protected routes.
    $authGroup = $app->group('', function (\Slim\Routing\RouteCollectorProxy $g) use ($authHandler, $itemHandler) {
        $g->get('/auth/me',           [$authHandler, 'me']);
        $g->post('/auth/logout',      [$authHandler, 'logout']);
        $g->post('/auth/api-key',     [$authHandler, 'generateApiKey']);
        $g->delete('/auth/api-key',   [$authHandler, 'deleteApiKey']);

        $g->get('/users/me/items',         [$itemHandler, 'list']);
        $g->post('/users/me/items',        [$itemHandler, 'create']);
        $g->get('/users/me/items/{id}',    [$itemHandler, 'get']);
        $g->put('/users/me/items/{id}',    [$itemHandler, 'update']);
        $g->delete('/users/me/items/{id}', [$itemHandler, 'delete']);
    })->addMiddleware($authMw);
}

$app->run();
