using System.Security.Claims;
using App.Data;
using Microsoft.EntityFrameworkCore;

namespace App.Auth;

public class ApiKeyMiddleware(RequestDelegate next)
{
    private const string ApiKeyHeader = "X-API-Key";

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        // Skip: Authorization header already set (JWT path handled by AddJwtBearer).
        if (context.Request.Headers.ContainsKey("Authorization"))
        {
            await next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(ApiKeyHeader, out var rawKey))
        {
            await next(context);
            return;
        }

        var apiKey = rawKey.ToString();
        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.ApiKey == apiKey);

        if (user is null)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid API key." });
            return;
        }

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("name", user.Name),
        };

        var identity = new ClaimsIdentity(claims, "ApiKey");
        context.User = new ClaimsPrincipal(identity);

        await next(context);
    }
}

file static class JwtRegisteredClaimNames
{
    public const string Sub = "sub";
    public const string Email = "email";
}

public static class ApiKeyMiddlewareExtensions
{
    public static IApplicationBuilder UseApiKeyMiddleware(this IApplicationBuilder app)
        => app.UseMiddleware<ApiKeyMiddleware>();
}
