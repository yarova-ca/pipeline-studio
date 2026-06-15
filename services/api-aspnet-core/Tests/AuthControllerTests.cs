using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using App.Auth;
using App.Data;
using App.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace any existing DbContext registration with in-memory
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase($"auth-test-{Guid.NewGuid()}"));
            });
        });
    }

    // --- 401 with no auth ---

    [Fact]
    public async Task GetMe_NoAuth_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- 200 with valid JWT ---

    [Fact]
    public async Task GetMe_ValidJwt_Returns200()
    {
        var client = CreateClientWithUser(out var userId, out var email, out var name);

        var response = await client.GetAsync("/auth/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<MeResponse>();
        Assert.NotNull(body);
        Assert.Equal(email, body.Email);
    }

    // --- 200 with valid API key ---

    [Fact]
    public async Task GetMe_ValidApiKey_Returns200()
    {
        const string apiKey = "test-api-key-abc123";

        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null) services.Remove(descriptor);

                var dbName = $"api-key-test-{Guid.NewGuid()}";

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase(dbName));
            });
        });

        // Seed user with API key
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = "apikey@test.com",
                Name = "API User",
                ApiKey = apiKey,
                Provider = "test",
            });
            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        var response = await client.GetAsync("/auth/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // --- 401 with bad API key ---

    [Fact]
    public async Task GetMe_BadApiKey_Returns401()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-API-Key", "totally-invalid-key");

        var response = await client.GetAsync("/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ---- helpers ----

    private HttpClient CreateClientWithUser(
        out Guid userId, out string email, out string name)
    {
        userId = Guid.NewGuid();
        email = $"user-{userId}@test.com";
        name = "Test User";

        var jwtService = new JwtService(
            new TestConfiguration("dev-secret-change-in-production-must-be-at-least-32-chars"));

        var token = jwtService.GenerateToken(userId, email, name);

        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null) services.Remove(descriptor);

                var dbName = $"jwt-test-{Guid.NewGuid()}";
                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase(dbName));
            });
        });

        // Seed the user so /auth/me can find them
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Users.Add(new User
            {
                Id = userId,
                Email = email,
                Name = name,
                Provider = "test",
            });
            db.SaveChanges();
        }

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        return client;
    }
}

// Minimal IConfiguration shim for JwtService in tests
internal sealed class TestConfiguration(string jwtSecret) : Microsoft.Extensions.Configuration.IConfiguration
{
    public string? this[string key]
    {
        get => key == "JWT_SECRET" ? jwtSecret : null;
        set { }
    }

    public IEnumerable<Microsoft.Extensions.Configuration.IConfigurationSection> GetChildren()
        => Enumerable.Empty<Microsoft.Extensions.Configuration.IConfigurationSection>();

    public Microsoft.Extensions.Primitives.IChangeToken GetReloadToken()
        => new Microsoft.Extensions.Primitives.CancellationChangeToken(CancellationToken.None);

    public Microsoft.Extensions.Configuration.IConfigurationSection GetSection(string key)
        => new Microsoft.Extensions.Configuration.ConfigurationSection(
            new Microsoft.Extensions.Configuration.ConfigurationRoot(
                new List<Microsoft.Extensions.Configuration.IConfigurationProvider>()), key);
}

internal sealed record MeResponse(
    Guid Id, string Email, string Name, string Provider,
    DateTime CreatedAt, bool HasApiKey);
