using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;

public class HealthTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public HealthTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact] public async Task GetHello_ReturnsOk() => Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/")).StatusCode);
    [Fact] public async Task GetHealth_ReturnsOk() => Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/health")).StatusCode);
    [Fact] public async Task GetLive_ReturnsOk() => Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/health/live")).StatusCode);
    [Fact] public async Task GetReady_ReturnsOk() => Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/health/ready")).StatusCode);
}
