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

    // /health/ready is served by MapHealthChecks in Program.cs.
    // That endpoint runs a live DB check via AddDbContextCheck<AppDbContext>.
    // Returns 200 {"status":"ok","db":"connected"} or 503 {"status":"error","db":"disconnected"}.
}
