using Prometheus;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.AddJsonConsole(options => {
    options.IncludeScopes = true;
    options.TimestampFormat = "O";
    options.JsonWriterOptions = new System.Text.Json.JsonWriterOptions { Indented = false };
});

builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>();
var app = builder.Build();
app.UseRouting();
app.UseMetricServer();
app.UseHttpMetrics();
app.MapGraphQL();
app.MapGet("/health", () => Results.Ok(new { status = "ok", version = "1.0.0" }));
app.MapGet("/health/live", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/ready", () => Results.Ok(new { status = "ok" }));
app.Run();

public class Query {
    public string Health() => "ok";
}
