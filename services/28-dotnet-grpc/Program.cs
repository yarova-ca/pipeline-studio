var builder = WebApplication.CreateBuilder(args);
builder.Services.AddGrpc();
builder.Services.AddGrpcHealthChecks();
builder.WebHost.ConfigureKestrel(o => {
    o.ListenAnyIP(50051, lo => lo.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http2);
    o.ListenAnyIP(8080);
});
var app = builder.Build();
app.MapGrpcHealthChecksService();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/live", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/ready", () => Results.Ok(new { status = "ok" }));
app.Run();
