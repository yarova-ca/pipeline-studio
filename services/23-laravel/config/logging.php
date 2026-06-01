<?php

/**
 * Logging configuration — JSON structured logging.
 * Emits one JSON object per log entry to stdout.
 * The 'stack' channel writes to 'single' which writes to stderr/stdout.
 */

return [
    'default' => env('LOG_CHANNEL', 'json'),

    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => ['json'],
        ],

        // JSON structured logging — emits one object per line to stdout.
        // Compatible with log aggregators (Loki, Datadog, CloudWatch).
        'json' => [
            'driver' => 'monolog',
            'handler' => \Monolog\Handler\StreamHandler::class,
            'formatter' => \Monolog\Formatter\JsonFormatter::class,
            'with' => [
                'stream' => 'php://stdout',
            ],
        ],

        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
        ],
    ],
];
