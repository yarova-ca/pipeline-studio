package ca.yarova.ws;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.io.OutputStream;

public class Server extends WebSocketServer {
    public Server(int port) { super(new InetSocketAddress(port)); }

    @Override public void onOpen(WebSocket ws, ClientHandshake hs) {
        System.out.println("Client connected");
    }
    @Override public void onClose(WebSocket ws, int code, String reason, boolean remote) {}
    @Override public void onMessage(WebSocket ws, String msg) {
        ws.send("{\"echo\":\"" + msg + "\"}");
    }
    @Override public void onError(WebSocket ws, Exception ex) { ex.printStackTrace(); }
    @Override public void onStart() { System.out.println("WS server started"); }

    public static void main(String[] args) throws Exception {
        int wsPort = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        int httpPort = wsPort + 1;

        HttpServer http = HttpServer.create(new InetSocketAddress(httpPort), 0);
        http.createContext("/health", ex -> {
            byte[] b = "{\"status\":\"ok\"}".getBytes();
            ex.getResponseHeaders().add("Content-Type", "application/json");
            ex.sendResponseHeaders(200, b.length);
            try (OutputStream os = ex.getResponseBody()) { os.write(b); }
        });
        http.start();

        Server ws = new Server(wsPort);
        ws.start();
        System.out.println("WebSocket on :" + wsPort + ", health on :" + httpPort);
    }
}
