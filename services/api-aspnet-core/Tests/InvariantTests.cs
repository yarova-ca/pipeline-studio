using System.Net;
using System.Net.Http.Headers;
using System.Text;
using App.Auth;
using App.Data;
using App.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

// Yarova platform invariant suite for service: 19-aspnet-core.
//
// Each test maps to ONE platform invariant by I-id.
// The assertion is the invariant; never weaken it.
//
// Protected route used: /users/me/items ([Authorize]).
// Token minted exactly how the app validates it:
//   HMAC-SHA256, issuer "pipeline-studio", audience "pipeline-studio",
//   signing key = JWT_SECRET (must match appsettings.json).
public class InvariantTests
{
    // Must match App/appsettings.json -> JWT_SECRET so the minted token's
    // signature validates against the running app's signing key.
    private const string JwtSecret =
        "dev-secret-change-in-production-must-be-at-least-32-chars";

    // A real protected route guarded by [Authorize].
    private const string ProtectedRoute = "/users/me/items";

    // ---- I-3: protected route with NO Authorization header -> 401 ----

    [Fact]
    public async Task I3_ProtectedRoute_NoAuthHeader_Returns401()
    {
        var (factory, _) = NewFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync(ProtectedRoute);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ---- I-4: protected route with a garbage/tampered Bearer token -> 401 ----

    [Fact]
    public async Task I4_ProtectedRoute_GarbageBearerToken_Returns401()
    {
        var (factory, _) = NewFactory();
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", "not.a.real.jwt-token-deadbeef");

        var response = await client.GetAsync(ProtectedRoute);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ---- I-6: POST with VALID token + unknown extra JSON field -> 400 ----

    [Fact]
    public async Task I6_Post_ValidToken_UnknownJsonField_Returns400()
    {
        var (factory, userId) = NewFactory();
        await SeedUser(factory, userId);

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", MintToken(userId));

        // Valid title plus an unknown field the DTO does not declare.
        // CreateItemRequest only has: title, description.
        var json = """{"title":"ok","description":"d","unknownField":"x"}""";
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync(ProtectedRoute, content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // Control: the SAME request without the unknown field is accepted (201).
    // Proves the 400 above is caused by the unknown field, not by auth/shape.
    [Fact]
    public async Task I6_Post_ValidToken_KnownFieldsOnly_Returns201()
    {
        var (factory, userId) = NewFactory();
        await SeedUser(factory, userId);

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", MintToken(userId));

        var json = """{"title":"ok","description":"d"}""";
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync(ProtectedRoute, content);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // ---- I-10: GET /health/live -> 200 ----

    [Fact]
    public async Task I10_HealthLive_Returns200()
    {
        var (factory, _) = NewFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health/live");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ---- I-13: GET /metrics -> 200 + golden-signal request-duration metric ----

    [Fact]
    public async Task I13_Metrics_Returns200_WithRequestDurationMetric()
    {
        var (factory, _) = NewFactory();
        var client = factory.CreateClient();

        // Drive one request first so prometheus-net records a duration sample.
        await client.GetAsync("/health/live");

        var response = await client.GetAsync("/metrics");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("http_request_duration_seconds", body);
    }

    // ---- I-17: response carries X-Content-Type-Options: nosniff ----

    [Fact]
    public async Task I17_Response_CarriesNosniffHeader()
    {
        var (factory, _) = NewFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health/live");

        Assert.True(response.Headers.TryGetValues("X-Content-Type-Options", out var values),
            "X-Content-Type-Options header missing.");
        Assert.Contains("nosniff", values!);
    }

    // ---- helpers ----

    // Each test gets an isolated in-memory DB so state never leaks between tests.
    private static (WebApplicationFactory<Program> factory, Guid userId) NewFactory()
    {
        var userId = Guid.NewGuid();
        var dbName = $"invariant-{Guid.NewGuid()}";

        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null) services.Remove(descriptor);

                    services.AddDbContext<AppDbContext>(options =>
                        options.UseInMemoryDatabase(dbName));
                });
            });

        return (factory, userId);
    }

    private static async Task SeedUser(WebApplicationFactory<Program> factory, Guid userId)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Users.Add(new User
        {
            Id = userId,
            Email = $"user-{userId}@test.com",
            Name = "Invariant User",
            Provider = "test",
        });
        await db.SaveChangesAsync();
    }

    // Mint a token exactly how the app validates it.
    private static string MintToken(Guid userId)
    {
        var jwtService = new JwtService(
            new TestConfiguration(JwtSecret), new App.Compliance());
        return jwtService.GenerateToken(userId, $"user-{userId}@test.com", "Invariant User");
    }
}
