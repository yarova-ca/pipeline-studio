<?php
// Structured JSON logging for PHP services.
// Monolog: PHP logging library with structured output support.

use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Monolog\Formatter\JsonFormatter;

function createLogger(string $channel = 'app'): Logger {
    $logger = new Logger($channel);
    $handler = new StreamHandler('php://stdout', Logger::INFO);
    $handler->setFormatter(new JsonFormatter());
    $logger->pushHandler($handler);
    return $logger;
}
