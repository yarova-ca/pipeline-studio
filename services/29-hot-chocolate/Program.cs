var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>();
var app = builder.Build();
app.MapGraphQL();
app.MapGet("/health", () => Results.Ok(new { status = "ok", version = "1.0.0" }));
app.MapGet("/health/live", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/ready", () => Results.Ok(new { status = "ok" }));
app.Run();

public class Query {
    public string Health() => "ok";
}
