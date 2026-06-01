using Microsoft.AspNetCore.Mvc;

namespace App.Controllers;

[ApiController]
[Route("")]
public class HelloController : ControllerBase
{
    [HttpGet("/")] public IActionResult Hello() =>
        Ok(new { message = "Hello from ASP.NET Core 9", framework = "19-aspnet-core", version = "1.0.0" });

    [HttpGet("/health")] public IActionResult Health() =>
        Ok(new { status = "ok", version = "1.0.0" });

    [HttpGet("/health/live")] public IActionResult Liveness() => Ok(new { status = "ok" });
    [HttpGet("/health/ready")] public IActionResult Readiness() => Ok(new { status = "ok" });
}
