using System.Security.Claims;
using System.Security.Cryptography;
using App.Auth;
using App.Data;
using App.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace App.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(
    AppDbContext db,
    JwtService jwtService,
    IConfiguration configuration,
    IWebHostEnvironment env) : ControllerBase
{
    // GET /auth/login — redirect to GitHub OAuth
    [HttpGet("login")]
    public IActionResult Login()
    {
        var clientId = configuration["GITHUB_CLIENT_ID"] ?? "dev-client-id";
        var redirectUri = Uri.EscapeDataString(
            configuration["GITHUB_CALLBACK_URL"] ?? "http://localhost:8080/auth/callback");
        var githubUrl =
            $"https://github.com/login/oauth/authorize?client_id={clientId}&redirect_uri={redirectUri}&scope=user:email";
        return Redirect(githubUrl);
    }

    // GET /auth/callback — exchange code, upsert user, return JWT
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string code, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest(new { error = "Missing OAuth code." });

        var clientId = configuration["GITHUB_CLIENT_ID"] ?? string.Empty;
        var clientSecret = configuration["GITHUB_CLIENT_SECRET"] ?? string.Empty;

        using var http = new HttpClient();
        http.DefaultRequestHeaders.Add("Accept", "application/json");

        var tokenRes = await http.PostAsJsonAsync(
            "https://github.com/login/oauth/access_token",
            new { client_id = clientId, client_secret = clientSecret, code },
            ct);

        if (!tokenRes.IsSuccessStatusCode)
            return StatusCode(502, new { error = "GitHub token exchange failed." });

        var tokenBody = await tokenRes.Content.ReadFromJsonAsync<GitHubTokenResponse>(cancellationToken: ct);
        if (tokenBody?.AccessToken is null)
            return StatusCode(502, new { error = "No access token from GitHub." });

        http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokenBody.AccessToken);
        http.DefaultRequestHeaders.Add("User-Agent", "pipeline-studio");

        var userRes = await http.GetAsync("https://api.github.com/user", ct);
        if (!userRes.IsSuccessStatusCode)
            return StatusCode(502, new { error = "GitHub user fetch failed." });

        var githubUser = await userRes.Content.ReadFromJsonAsync<GitHubUserResponse>(cancellationToken: ct);
        if (githubUser is null)
            return StatusCode(502, new { error = "Could not parse GitHub user." });

        var email = githubUser.Email ?? $"{githubUser.Login}@github.noemail";

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

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

        await db.SaveChangesAsync(ct);

        var jwt = jwtService.GenerateToken(user.Id, user.Email, user.Name);
        return Ok(new { token = jwt });
    }

    // GET /auth/me — return current user
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var user = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId.Value, ct);

        if (user is null) return NotFound();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.Name,
            user.Provider,
            user.CreatedAt,
            HasApiKey = user.ApiKey is not null,
        });
    }

    // POST /auth/logout — clear cookie, return Ok
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("auth_token");
        return Ok(new { message = "Logged out." });
    }

    // POST /auth/api-key — generate api key
    [HttpPost("api-key")]
    [Authorize]
    public async Task<IActionResult> GenerateApiKey(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
        if (user is null) return NotFound();

        var key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');

        user.ApiKey = key;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(new { apiKey = key });
    }

    // DELETE /auth/api-key — revoke api key
    [HttpDelete("api-key")]
    [Authorize]
    public async Task<IActionResult> RevokeApiKey(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
        if (user is null) return NotFound();

        user.ApiKey = null;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(new { message = "API key revoked." });
    }

    // POST /dev/token — development-only test JWT
    [HttpPost("/dev/token")]
    public IActionResult DevToken([FromBody] DevTokenRequest? req)
    {
        if (!env.IsDevelopment())
            return NotFound();

        var userId = req?.UserId ?? Guid.NewGuid();
        var email = req?.Email ?? "dev@example.com";
        var name = req?.Name ?? "Dev User";

        var token = jwtService.GenerateToken(userId, email, name);
        return Ok(new { token });
    }

    private Guid? GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}

// ---- DTOs ----

public record DevTokenRequest(Guid? UserId, string? Email, string? Name);

internal sealed record GitHubTokenResponse(
    [property: System.Text.Json.Serialization.JsonPropertyName("access_token")]
    string? AccessToken);

internal sealed record GitHubUserResponse(
    [property: System.Text.Json.Serialization.JsonPropertyName("login")]
    string? Login,
    [property: System.Text.Json.Serialization.JsonPropertyName("name")]
    string? Name,
    [property: System.Text.Json.Serialization.JsonPropertyName("email")]
    string? Email);
