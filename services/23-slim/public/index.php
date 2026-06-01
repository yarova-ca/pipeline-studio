<?php

require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app = AppFactory::create();

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

$app->get('/health/ready', function (Request $req, Response $res) {
    $res->getBody()->write(json_encode(['status' => 'ok']));
    return $res->withHeader('Content-Type', 'application/json');
});

$app->run();
