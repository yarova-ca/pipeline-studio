using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseWebSockets();

app.Map("/ws", async context => {
    if (context.WebSockets.IsWebSocketRequest) {
        var ws = await context.WebSockets.AcceptWebSocketAsync();
        var buf = new byte[4096];
        while (ws.State == WebSocketState.Open) {
            var r = await ws.ReceiveAsync(buf, CancellationToken.None);
            if (r.MessageType == WebSocketMessageType.Close) break;
            var msg = Encoding.UTF8.GetString(buf, 0, r.Count);
            var resp = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { echo = msg }));
            await ws.SendAsync(resp, WebSocketMessageType.Text, true, CancellationToken.None);
        }
        await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None);
    } else {
        context.Response.StatusCode = 400;
    }
});

app.MapGet("/health", () => Results.Ok(new { status = "ok", version = "1.0.0" }));
app.MapGet("/health/live", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/ready", () => Results.Ok(new { status = "ok" }));

app.Run();
