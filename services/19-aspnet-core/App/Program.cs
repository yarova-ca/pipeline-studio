using System.Text;
using App.Auth;
using App.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

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

// ---- Controllers ----
builder.Services.AddControllers();
builder.Services.AddHealthChecks();

var app = builder.Build();

// ---- Middleware pipeline ----
app.UseAuthentication();
app.UseApiKeyMiddleware();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/actuator/health");

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");
