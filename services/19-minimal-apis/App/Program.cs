var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => new { message = "Hello from Minimal APIs .NET 9", framework = "19-minimal-apis", version = "1.0.0" });
app.MapGet("/health", () => new { status = "ok", version = "1.0.0" });
app.MapGet("/health/live", () => new { status = "ok" });
app.MapGet("/health/ready", () => new { status = "ok" });

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");
