<?php
require 'vendor/autoload.php';

use Grpc\Channel;
use Grpc\Server;

$port = getenv('GRPC_PORT') ?: '50051';
echo "gRPC PHP server starting on :$port\n";
echo "Note: Use grpcio extension + generated stubs for production.\n";

// HTTP health sidecar
$httpPort = getenv('HTTP_PORT') ?: '8080';
$sock = stream_socket_server("tcp://0.0.0.0:$httpPort", $errno, $errstr);
echo "HTTP health sidecar on :$httpPort\n";

if ($sock) {
    while ($conn = stream_socket_accept($sock, -1)) {
        $req = fread($conn, 1024);
        $body = json_encode(['status' => 'ok']);
        fwrite($conn, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: " . strlen($body) . "\r\n\r\n$body");
        fclose($conn);
    }
}
