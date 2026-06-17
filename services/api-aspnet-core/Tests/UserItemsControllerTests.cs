using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using App.Auth;
using App.Data;
using App.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

public class UserItemsControllerTests
{
    private const string JwtSecret =
        "dev-secret-change-in-production-must-be-at-least-32-chars";

    // ---- GET /users/me/items ----

    [Fact]
    public async Task GetItems_ReturnsUserItems()
    {
        var (client, userId, db) = await CreateAuthenticatedClient();

        db.Items.Add(new Item { Title = "Alpha", UserId = userId });
        db.Items.Add(new Item { Title = "Beta", UserId = userId });
        await db.SaveChangesAsync();

        var response = await client.GetAsync("/users/me/items");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var items = await response.Content.ReadFromJsonAsync<List<ItemDto>>();
        Assert.NotNull(items);
        Assert.Equal(2, items.Count);
    }

    // ---- POST /users/me/items ----

    [Fact]
    public async Task CreateItem_ValidTitle_Returns201()
    {
        var (client, _, _) = await CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(
            "/users/me/items",
            new { title = "My Item", description = "A description" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ItemDto>();
        Assert.NotNull(body);
        Assert.Equal("My Item", body.Title);
    }

    [Fact]
    public async Task CreateItem_MissingTitle_Returns400()
    {
        var (client, _, _) = await CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(
            "/users/me/items",
            new { description = "no title here" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ---- GET /users/me/items/{id} ----

    [Fact]
    public async Task GetItem_Exists_Returns200()
    {
        var (client, userId, db) = await CreateAuthenticatedClient();

        var item = new Item { Title = "FindMe", UserId = userId };
        db.Items.Add(item);
        await db.SaveChangesAsync();

        var response = await client.GetAsync($"/users/me/items/{item.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetItem_NotFound_Returns404()
    {
        var (client, _, _) = await CreateAuthenticatedClient();
        var response = await client.GetAsync($"/users/me/items/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ---- PUT /users/me/items/{id} ----

    [Fact]
    public async Task UpdateItem_ValidRequest_Returns200()
    {
        var (client, userId, db) = await CreateAuthenticatedClient();

        var item = new Item { Title = "Original", UserId = userId };
        db.Items.Add(item);
        await db.SaveChangesAsync();

        var response = await client.PutAsJsonAsync(
            $"/users/me/items/{item.Id}",
            new { title = "Updated" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ItemDto>();
        Assert.Equal("Updated", body?.Title);
    }

    // ---- DELETE /users/me/items/{id} ----

    [Fact]
    public async Task DeleteItem_Exists_Returns204()
    {
        var (client, userId, db) = await CreateAuthenticatedClient();

        var item = new Item { Title = "DeleteMe", UserId = userId };
        db.Items.Add(item);
        await db.SaveChangesAsync();

        var response = await client.DeleteAsync($"/users/me/items/{item.Id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeleteItem_NotFound_Returns404()
    {
        var (client, _, _) = await CreateAuthenticatedClient();
        var response = await client.DeleteAsync($"/users/me/items/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ---- helper ----

    private static async Task<(HttpClient client, Guid userId, AppDbContext db)>
        CreateAuthenticatedClient()
    {
        var userId = Guid.NewGuid();
        var email = $"user-{userId}@test.com";
        var dbName = $"items-test-{Guid.NewGuid()}";

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

        // Seed user
        var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Users.Add(new User
        {
            Id = userId,
            Email = email,
            Name = "Test User",
            Provider = "test",
        });
        await db.SaveChangesAsync();

        var jwtService = new JwtService(new TestConfiguration(JwtSecret), new App.Compliance());
        var token = jwtService.GenerateToken(userId, email, "Test User");

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        return (client, userId, db);
    }
}

internal sealed record ItemDto(
    Guid Id, string Title, string? Description,
    Guid UserId, DateTime CreatedAt, DateTime UpdatedAt);
