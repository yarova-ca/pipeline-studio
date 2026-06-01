using System.Text;
using System.Threading.RateLimiting;
using App.Auth;
using App.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

// ---- JSON structured logging ----
// AddJsonConsole emits one JSON object per log line.
// Replaces the default plain-text console logger.
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
    options.UseUtcTimestamp = true;
});

// ---- Database ----
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(connectionString))
        options.UseNpgsql(connectionString);
    else
        options.UseInMemoryDatabase("pipeline-studio-dev");
});

// ---- JWT Auth ----
var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? throw new InvalidOperationException("JWT_SECRET must be set.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "pipeline-studio",
            ValidateAudience = true,
            ValidAudience = "pipeline-studio",
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSingleton<JwtService>();

// ---- Rate limiting ----
// 100 requests per minute per client IP.
// Health and docs endpoints are exempt via policy selector.
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var path = context.Request.Path.Value ?? "";
        if (path.StartsWith("/health") || path.StartsWith("/swagger") || path.StartsWith("/docs"))
            return RateLimitPartition.GetNoLimiter("exempt");

        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 100,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0,
        });
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            "{\"error\":\"Too many requests — try again in 60 seconds\"}", token);
    };
});

// ---- OpenTelemetry — guarded by OTEL_ENABLED=true ----
if (string.Equals(Environment.GetEnvironmentVariable("OTEL_ENABLED"), "true", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddOpenTelemetry()
        .WithTracing(tracing => tracing
            .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService("19-aspnet-core"))
            .AddAspNetCoreInstrumentation()
            .AddOtlpExporter());
}

// ---- Controllers ----
builder.Services.AddControllers();

// ---- OpenAPI / Swagger ----
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ASP.NET Core Service API", Version = "1.0.0" });
});

// ---- Health checks with DB ----
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("db");

var app = builder.Build();

// ---- Middleware pipeline ----
app.UseRateLimiter();
app.UseAuthentication();
app.UseApiKeyMiddleware();
app.UseAuthorization();

// Swagger UI at /docs, spec at /swagger/v1/swagger.json
app.UseSwagger(c => c.RouteTemplate = "swagger/{documentName}/swagger.json");
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
    c.RoutePrefix = "docs";
});

app.MapControllers();

// /health/ready checks DB connectivity — returns 503 when DB is down.
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var status = report.Status == Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Healthy
            ? "ok" : "error";
        var db = report.Entries.TryGetValue("db", out var dbEntry)
            ? (dbEntry.Status == Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Healthy
                ? "connected" : "disconnected")
            : "not configured";
        await context.Response.WriteAsync($"{{\"status\":\"{status}\",\"db\":\"{db}\"}}");
    }
});

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");
