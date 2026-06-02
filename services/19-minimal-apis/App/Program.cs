using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using App.Auth;
using App.Data;
using App.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using Prometheus;

var builder = WebApplication.CreateBuilder(args);

// ── Logging ───────────────────────────────────────────────────────────────
builder.Logging.AddJsonConsole(options => {
    options.IncludeScopes = true;
    options.TimestampFormat = "O";
    options.JsonWriterOptions = new System.Text.Json.JsonWriterOptions { Indented = false };
});

// ── Database ──────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(connectionString))
        options.UseNpgsql(connectionString);
    else
        options.UseInMemoryDatabase("pipeline-studio-dev");
});

// ── JWT Auth ──────────────────────────────────────────────────────────────
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

var app = builder.Build();

// ── Middleware ────────────────────────────────────────────────────────────
app.UseRouting();
app.UseMetricServer();
app.UseHttpMetrics();
app.UseAuthentication();
app.UseApiKeyMiddleware();
app.UseAuthorization();

// ── Health endpoints ──────────────────────────────────────────────────────
app.MapGet("/", () => new { message = "Hello from Minimal APIs .NET 9", framework = "19-minimal-apis", version = "1.0.0" });
app.MapGet("/health", () => new { status = "ok", version = "1.0.0" });
app.MapGet("/health/live", () => new { status = "ok" });
app.MapGet("/health/ready", async (AppDbContext db) =>
{
    try
    {
        await db.Database.ExecuteSqlRawAsync("SELECT 1");
        return Results.Ok(new { status = "ok", db = "connected" });
    }
    catch
    {
        return Results.Json(new { status = "error", db = "disconnected" }, statusCode: 503);
    }
});

// ── Auth routes ───────────────────────────────────────────────────────────
var auth = app.MapGroup("/auth");

// GET /auth/login — redirect to GitHub OAuth.
auth.MapGet("/login", (IConfiguration cfg) =>
{
    var clientId = cfg["GITHUB_CLIENT_ID"] ?? "dev-client-id";
    var redirectUri = Uri.EscapeDataString(cfg["GITHUB_CALLBACK_URL"] ?? "http://localhost:8080/auth/callback");
    return Results.Redirect(
        $"https://github.com/login/oauth/authorize?client_id={clientId}&redirect_uri={redirectUri}&scope=user:email");
});

// GET /auth/callback — exchange code, upsert user, return JWT.
auth.MapGet("/callback", async (string code, AppDbContext db, JwtService jwtService, IConfiguration cfg) =>
{
    if (string.IsNullOrWhiteSpace(code))
        return Results.BadRequest(new { error = "Missing OAuth code." });

    var clientId = cfg["GITHUB_CLIENT_ID"] ?? string.Empty;
    var clientSecret = cfg["GITHUB_CLIENT_SECRET"] ?? string.Empty;

    using var http = new HttpClient();
    http.DefaultRequestHeaders.Add("Accept", "application/json");

    var tokenRes = await http.PostAsJsonAsync(
        "https://github.com/login/oauth/access_token",
        new { client_id = clientId, client_secret = clientSecret, code });

    if (!tokenRes.IsSuccessStatusCode)
        return Results.Problem("GitHub token exchange failed.", statusCode: 502);

    var tokenBody = await tokenRes.Content.ReadFromJsonAsync<GitHubTokenResponse>();
    if (tokenBody?.AccessToken is null)
        return Results.Problem("No access token from GitHub.", statusCode: 502);

    http.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokenBody.AccessToken);
    http.DefaultRequestHeaders.Add("User-Agent", "pipeline-studio");

    var userRes = await http.GetAsync("https://api.github.com/user");
    if (!userRes.IsSuccessStatusCode)
        return Results.Problem("GitHub user fetch failed.", statusCode: 502);

    var githubUser = await userRes.Content.ReadFromJsonAsync<GitHubUserResponse>();
    if (githubUser is null)
        return Results.Problem("Could not parse GitHub user.", statusCode: 502);

    var email = githubUser.Email ?? $"{githubUser.Login}@github.noemail";
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

    if (user is null)
    {
        user = new User
        {
            Email = email,
            Name = githubUser.Name ?? githubUser.Login ?? email,
            Provider = "github",
        };
        db.Users.Add(user);
    }
    else
    {
        user.Name = githubUser.Name ?? githubUser.Login ?? user.Name;
        user.UpdatedAt = DateTime.UtcNow;
    }
    await db.SaveChangesAsync();

    return Results.Ok(new { token = jwtService.GenerateToken(user.Id, user.Email, user.Name) });
});

// GET /auth/me — current user.
auth.MapGet("/me", [Authorize] (HttpContext ctx, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    if (userId is null) return Results.Unauthorized();
    var name = ctx.User.FindFirstValue("name") ?? string.Empty;
    var email = ctx.User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)
             ?? ctx.User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    return Results.Ok(new { id = userId, email, name });
}).RequireAuthorization();

// POST /auth/logout
auth.MapPost("/logout", [Authorize] () => Results.Ok(new { message = "Logged out." }));

// POST /auth/api-key — generate API key.
auth.MapPost("/api-key", [Authorize] async (HttpContext ctx, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    if (userId is null) return Results.Unauthorized();
    var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
    if (user is null) return Results.NotFound();

    var key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
        .Replace("+", "-").Replace("/", "_").TrimEnd('=');
    user.ApiKey = key;
    user.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { apiKey = key });
}).RequireAuthorization();

// DELETE /auth/api-key — revoke API key.
auth.MapDelete("/api-key", [Authorize] async (HttpContext ctx, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    if (userId is null) return Results.Unauthorized();
    var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
    if (user is null) return Results.NotFound();
    user.ApiKey = null;
    user.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "API key revoked." });
}).RequireAuthorization();

// POST /dev/token — development-only JWT.
app.MapPost("/dev/token", (DevTokenRequest? req, JwtService jwtService, IWebHostEnvironment env) =>
{
    if (!env.IsDevelopment()) return Results.NotFound();
    var userId = req?.UserId ?? Guid.NewGuid();
    var email = req?.Email ?? "dev@example.com";
    var name = req?.Name ?? "Dev User";
    return Results.Ok(new { token = jwtService.GenerateToken(userId, email, name) });
});

// ── User items routes ─────────────────────────────────────────────────────
var items = app.MapGroup("/users/me/items").RequireAuthorization();

// GET /users/me/items
items.MapGet("/", async (HttpContext ctx, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    if (userId is null) return Results.Unauthorized();
    var list = await db.Items
        .AsNoTracking()
        .Where(i => i.UserId == userId.Value)
        .OrderByDescending(i => i.CreatedAt)
        .Select(i => new ItemResponse(i.Id, i.Title, i.Description, i.UserId, i.CreatedAt, i.UpdatedAt))
        .ToListAsync();
    return Results.Ok(list);
});

// POST /users/me/items
items.MapPost("/", async (HttpContext ctx, AppDbContext db, CreateItemRequest? req) =>
{
    if (req is null || string.IsNullOrWhiteSpace(req.Title))
        return Results.BadRequest(new { error = "Title is required." });
    var userId = GetUserId(ctx);
    if (userId is null) return Results.Unauthorized();
    var item = new Item { Title = req.Title.Trim(), Description = req.Description?.Trim(), UserId = userId.Value };
    db.Items.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/users/me/items/{item.Id}",
        new ItemResponse(item.Id, item.Title, item.Description, item.UserId, item.CreatedAt, item.UpdatedAt));
});

// GET /users/me/items/{id}
items.MapGet("/{id:guid}", async (HttpContext ctx, AppDbContext db, Guid id) =>
{
    var userId = GetUserId(ctx);
    if (userId is null) return Results.Unauthorized();
    var item = await db.Items.AsNoTracking()
        .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId.Value);
    return item is null ? Results.NotFound() :
        Results.Ok(new ItemResponse(item.Id, item.Title, item.Description, item.UserId, item.CreatedAt, item.UpdatedAt));
});

// PUT /users/me/items/{id}
items.MapPut("/{id:guid}", async (HttpContext ctx, AppDbContext db, Guid id, UpdateItemRequest? req) =>
{
    if (req is null) return Results.BadRequest(new { error = "Request body required." });
    var userId = GetUserId(ctx);
    if (userId is null) return Results.Unauthorized();
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId.Value);
    if (item is null) return Results.NotFound();
    if (req.Title is not null) { if (string.IsNullOrWhiteSpace(req.Title)) return Results.BadRequest(new { error = "Title cannot be empty." }); item.Title = req.Title.Trim(); }
    if (req.Description is not null) item.Description = req.Description.Trim();
    item.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new ItemResponse(item.Id, item.Title, item.Description, item.UserId, item.CreatedAt, item.UpdatedAt));
});

// DELETE /users/me/items/{id}
items.MapDelete("/{id:guid}", async (HttpContext ctx, AppDbContext db, Guid id) =>
{
    var userId = GetUserId(ctx);
    if (userId is null) return Results.Unauthorized();
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId.Value);
    if (item is null) return Results.NotFound();
    db.Items.Remove(item);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ── Helpers ───────────────────────────────────────────────────────────────
static Guid? GetUserId(HttpContext ctx)
{
    var raw = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)
           ?? ctx.User.FindFirstValue("sub");
    return Guid.TryParse(raw, out var id) ? id : null;
}

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");

// ── DTOs ──────────────────────────────────────────────────────────────────
public record DevTokenRequest(Guid? UserId, string? Email, string? Name);
public record CreateItemRequest(string? Title, string? Description);
public record UpdateItemRequest(string? Title, string? Description);
public record ItemResponse(Guid Id, string Title, string? Description, Guid UserId, DateTime CreatedAt, DateTime UpdatedAt);

internal sealed record GitHubTokenResponse(
    [property: System.Text.Json.Serialization.JsonPropertyName("access_token")]
    string? AccessToken);

internal sealed record GitHubUserResponse(
    [property: System.Text.Json.Serialization.JsonPropertyName("login")] string? Login,
    [property: System.Text.Json.Serialization.JsonPropertyName("name")] string? Name,
    [property: System.Text.Json.Serialization.JsonPropertyName("email")] string? Email);
